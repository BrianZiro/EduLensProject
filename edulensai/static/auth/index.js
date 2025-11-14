// Add this helper function at the top of the file
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
// Enhanced computeRisk function with detailed risk analysis
async function computeRisk(profile) {
    try {
        // Calculate average score from subjects
        const avg = profile.subjects && profile.subjects.length ? 
            (profile.subjects.reduce((s, x) => s + x.score, 0) / profile.subjects.length) : 100;
        
        // Prepare data for the AI model
        const modelData = {
            attendance: profile.attendance,
            test_score: avg,
            parental_involvement: profile.parentInvolvement === 'high' ? 3 : 
                                 profile.parentInvolvement === 'medium' ? 2 : 1,
            discipline_count: profile.discipline
        };
        
        // Call your Django AI endpoint
        const response = await fetch('/predict/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(modelData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Analyze specific risk factors
            const riskFactors = analyzeRiskFactors(profile, avg, result.prediction);
            
            return {
                riskLabel: result.risk_level,
                attendancePct: Math.round((profile.attendance / 31) * 100),
                avg: Math.round(avg),
                riskScore: result.prediction,
                riskFactors: riskFactors,
                confidence: result.prediction // AI model confidence
            };
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('AI prediction failed:', error);
        // Fallback to simple logic if AI fails
        const attendancePct = (profile.attendance / 31) * 100;
        const avg = profile.subjects && profile.subjects.length ? 
            (profile.subjects.reduce((s, x) => s + x.score, 0) / profile.subjects.length) : 100;
        
        const riskFactors = analyzeRiskFactors(profile, avg, 0);
        
        let riskScore = 0;
        if (attendancePct < 75) riskScore += 2;
        if (avg < 50) riskScore += 2;
        if (profile.discipline > 5) riskScore += 1;
        if (profile.parentInvolvement === 'low') riskScore += 1;
        
        let riskLabel = 'Low';
        if (riskScore >= 4) riskLabel = 'High';
        else if (riskScore >= 2) riskLabel = 'Medium';
        
        return { 
            riskLabel, 
            attendancePct: Math.round(attendancePct), 
            avg: Math.round(avg), 
            riskScore,
            riskFactors,
            confidence: 0.5
        };
    }
}

// Function to analyze specific risk factors
function analyzeRiskFactors(profile, avgScore, aiPrediction) {
    const factors = [];
    const attendancePct = (profile.attendance / 31) * 100;
    
    // Attendance analysis
    if (attendancePct < 60) {
        factors.push({
            type: 'attendance',
            severity: 'critical',
            message: `Very low attendance: ${Math.round(attendancePct)}% (Critical: <60%)`,
            impact: 'High risk of academic failure'
        });
    } else if (attendancePct < 75) {
        factors.push({
            type: 'attendance',
            severity: 'warning',
            message: `Low attendance: ${Math.round(attendancePct)}% (Warning: <75%)`,
            impact: 'May affect academic performance'
        });
    }
    
    // Academic performance analysis
    if (avgScore < 40) {
        factors.push({
            type: 'academic',
            severity: 'critical',
            message: `Poor academic performance: ${Math.round(avgScore)}% average`,
            impact: 'High risk of dropout'
        });
    } else if (avgScore < 60) {
        factors.push({
            type: 'academic',
            severity: 'warning',
            message: `Below average performance: ${Math.round(avgScore)}% average`,
            impact: 'Needs academic support'
        });
    }
    
    // Discipline analysis
    if (profile.discipline > 5) {
        factors.push({
            type: 'discipline',
            severity: 'critical',
            message: `High discipline incidents: ${profile.discipline} this month`,
            impact: 'Behavioral issues affecting learning'
        });
    } else if (profile.discipline > 2) {
        factors.push({
            type: 'discipline',
            severity: 'warning',
            message: `Multiple discipline incidents: ${profile.discipline} this month`,
            impact: 'May indicate underlying issues'
        });
    }
    
    // Parental involvement analysis
    if (profile.parentInvolvement === 'low') {
        factors.push({
            type: 'parental',
            severity: 'warning',
            message: 'Low parental involvement',
            impact: 'Limited support system at home',
            recommendation:'Taking action by visiting the parent'
        });
    }
    
    // AI model insights
    if (aiPrediction > 0.7) {
        factors.push({
            type: 'ai_prediction',
            severity: 'critical',
            message: `AI Model Prediction: ${Math.round(aiPrediction * 100)}% dropout risk`,
            impact: 'High probability of academic failure'
        });
    } else if (aiPrediction > 0.4) {
        factors.push({
            type: 'ai_prediction',
            severity: 'warning',
            message: `AI Model Prediction: ${Math.round(aiPrediction * 100)}% dropout risk`,
            impact: 'Moderate risk requiring attention'
        });
    }
    
    return factors;
}

async function showAlerts() {
    const alertsOutput = document.getElementById('alerts-output');
    alertsOutput.innerHTML = ''; // Clear existing alerts first
    
    const raw = localStorage.getItem('edu_profiles');
    if (!raw) {
        alertsOutput.innerHTML = '<p class="muted">No student profiles saved yet.</p>';
        return;
    }
    
    const profiles = JSON.parse(raw);
    const alerts = [];
    const processedNames = new Set(); // Track processed students
    
    // Process each profile with AI predictions
    for (const profile of profiles) {
        // Skip if already processed (prevent duplicates)
        if (processedNames.has(profile.studentName.toLowerCase())) {
            console.log(`Skipping duplicate: ${profile.studentName}`);
            continue;
        }
        processedNames.add(profile.studentName.toLowerCase());
        
        try {
            const riskAnalysis = await computeRisk(profile);
            alerts.push({ profile, riskAnalysis });
        } catch (error) {
            console.error(`Failed to analyze profile ${profile.studentName}:`, error);
        }
    }
    
    // Sort alerts by risk level (High, Medium, Low)
    alerts.sort((a, b) => {
        const riskOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
        return riskOrder[b.riskAnalysis.riskLabel] - riskOrder[a.riskAnalysis.riskLabel];
    });
    
    // Display alerts with color coding
    alerts.forEach(({ profile, riskAnalysis }) => {
        const alertDiv = createAlertCard(profile, riskAnalysis);
        alertsOutput.appendChild(alertDiv);
    });
    // Update the dashboard after analyzing risk
const dashRisk = document.getElementById('dash-risk');
const snapAtRisk = document.getElementById('snap-at-risk');

const atRiskCount = alerts.filter(a => a.riskAnalysis.riskLabel !== 'Low').length;

if (dashRisk) dashRisk.textContent = atRiskCount;
if (snapAtRisk) snapAtRisk.textContent = atRiskCount;

}
// Function to create individual alert cards
function createAlertCard(profile, riskAnalysis) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert-card ${riskAnalysis.riskLabel.toLowerCase()}-risk`;
    
    // Color coding based on risk level
    const colors = {
        'High': '#ff4444',    // Red
        'Medium': '#4444ff',  // Blue  
        'Low': '#44ff44'      // Green
    };
    
    const riskColor = colors[riskAnalysis.riskLabel] || '#666666';
    
    // Create risk factors HTML
    const riskFactorsHtml = riskAnalysis.riskFactors.map(factor => `
        <div class="risk-factor ${factor.severity}">
            <div class="factor-icon">${getFactorIcon(factor.type)}</div>
            <div class="factor-content">
                <div class="factor-message">${factor.message}</div>
                <div class="factor-impact">${factor.impact}</div>
            </div>
        </div>
    `).join('');
    
    alertDiv.innerHTML = `
        <div class="alert-header" style="border-left: 4px solid ${riskColor}">
            <div class="student-info">
                <h3>${escapeHtml(profile.studentName)}</h3>
                <div class="risk-badge" style="background-color: ${riskColor}">
                    ${riskAnalysis.riskLabel} Risk
                </div>
            </div>
            <div class="risk-stats">
                <div class="stat">
                    <span class="stat-label">Attendance:</span>
                    <span class="stat-value">${riskAnalysis.attendancePct}%</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Average:</span>
                    <span class="stat-value">${riskAnalysis.avg}%</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Discipline:</span>
                    <span class="stat-value">${profile.discipline}</span>
                </div>
            </div>
        </div>
        
        <div class="risk-factors">
            <h4>Risk Factors:</h4>
            ${riskFactorsHtml || '<p class="no-factors">No significant risk factors identified</p>'}
        </div>
        
        <div class="alert-actions">
            <button class="btn-small" onclick="viewStudentReport('${escapeHtml(profile.studentName)}')">
                View Report
            </button>
            <button class="btn-small" onclick="sendAlert('${escapeHtml(profile.studentName)}')">
                Send Alert
            </button>
        </div>
    `;
    
    return alertDiv;
}

// Helper function to get icons for different risk factors
function getFactorIcon(type) {
    const icons = {
        'attendance': '📅',
        'academic': '📚',
        'discipline': '⚠️',
        'parental': '👨‍👩‍👧‍👦',
        'ai_prediction': '🤖'
    };
    return icons[type] || '⚠️';
}

// Helper functions for alert actions
function viewStudentReport(studentName) {
    // Load the student profile and show their report
    loadProfileByName(studentName);
    showPage('report');
    generateReport(readForm());
}

function sendAlert(studentName) {
    // This could integrate with SMS/email services
    alert(`Alert sent for ${studentName}. This would typically send notifications to parents/teachers.`);
}


// Helper function for HTML escaping
function escapeHtml(s) {
    return String(s || '').replace(/[&<>"'`]/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;'
    })[c]);
}

// Form reading and population functions
function readForm() {
    const studentName = document.getElementById('studentName');
    const parentNames = document.getElementById('parentNames');
    const attendanceInput = document.getElementById('attendance');
    const disciplineInput = document.getElementById('discipline');
    const parentInvolvement = document.getElementById('parentInvolvement');
    const subjectsList = document.getElementById('subjects-list');
    
    const subjects = Array.from(subjectsList.querySelectorAll('.subject-row')).map(row => {
        const name = row.querySelector('.sub-name').value.trim();
        const score = parseFloat(row.querySelector('.sub-score').value || 0);
        return { name, score };
    }).filter(s => s.name.length > 0);
    
    return {
        studentName: studentName.value.trim(),
        parentNames: parentNames.value.trim(),
        attendance: parseInt(attendanceInput.value || 0, 10),
        discipline: parseInt(disciplineInput.value || 0, 10),
        parentInvolvement: parentInvolvement.value,
        subjects
    };
}

function populateForm(p) {
    const studentName = document.getElementById('studentName');
    const parentNames = document.getElementById('parentNames');
    const attendanceInput = document.getElementById('attendance');
    const disciplineInput = document.getElementById('discipline');
    const parentInvolvement = document.getElementById('parentInvolvement');
    const subjectsList = document.getElementById('subjects-list');
    
    studentName.value = p.studentName || '';
    parentNames.value = p.parentNames || '';
    attendanceInput.value = p.attendance != null ? p.attendance : 0;
    disciplineInput.value = p.discipline != null ? p.discipline : 0;
    parentInvolvement.value = p.parentInvolvement || 'medium';
    subjectsList.innerHTML = '';
    (p.subjects || []).forEach(s => subjectsList.appendChild(makeSubjectRow(s.name, s.score)));
    if (subjectsList.children.length === 0) subjectsList.appendChild(makeSubjectRow('Mathematics', 0));
}

function makeSubjectRow(name = '', score = 0) {
    const row = document.createElement('div');
    row.className = 'subject-row';
    row.innerHTML = `
        <input class="sub-name" placeholder="Subject" value="${escapeHtml(name)}"/>
        <input class="sub-score" type="number" min="0" max="100" value="${escapeHtml(score)}"/>
        <button type="button" class="sub-remove" title="Remove subject">✕</button>
    `;
    row.querySelector('.sub-remove').addEventListener('click', () => row.remove());
    return row;
}

// Profile saving function
function saveProfile(profile) {
    const raw = localStorage.getItem('edu_profiles');
    const arr = raw ? JSON.parse(raw) : [];
    const idx = arr.findIndex(p => p.studentName === profile.studentName);
    if (idx >= 0) arr[idx] = profile;
    else arr.push(profile);
    localStorage.setItem('edu_profiles', JSON.stringify(arr));
    updateDashboardAndSnapshots();
}

// Dashboard update function
function updateDashboardAndSnapshots() {
    const raw = localStorage.getItem('edu_profiles');
    const arr = raw ? JSON.parse(raw) : [];
    const reportsRaw = localStorage.getItem('edu_reports_count');
    const reportsCount = reportsRaw ? parseInt(reportsRaw, 10) : 0;
    
    // Update dashboard counters
    const snapStudents = document.getElementById('snap-students');
    const snapAtRisk = document.getElementById('snap-at-risk');
    const snapReports = document.getElementById('snap-reports');
    const dashStudents = document.getElementById('dash-students');
    const dashRisk = document.getElementById('dash-risk');
    const dashReports = document.getElementById('dash-reports');
    
    if (snapStudents) snapStudents.textContent = arr.length;
    if (snapAtRisk) snapAtRisk.textContent = '0'; // Will be updated by alerts
    if (snapReports) snapReports.textContent = reportsCount;
    if (dashStudents) dashStudents.textContent = arr.length;
    if (dashRisk) dashRisk.textContent = '0'; // Will be updated by alerts
    if (dashReports) dashReports.textContent = reportsCount;
    if (window.updateDashboardChart) window.updateDashboardChart();

}

// Page navigation function
function showPage(id) {
    const pages = document.querySelectorAll('.page');
    const navLinks = document.querySelectorAll('.nav-link');
    
    pages.forEach(p => p.id === id ? p.classList.add('active') : p.classList.remove('active'));
    navLinks.forEach(n => n.classList.toggle('active', n.dataset.target === id));
}

// Report generation function
function generateReport(profile) {
    const rName = document.getElementById('r-name');
    const rParents = document.getElementById('r-parents');
    const rAttendance = document.getElementById('r-attendance');
    const rAverage = document.getElementById('r-average');
    const rTotal = document.getElementById('r-total');
    const rAvg2 = document.getElementById('r-avg-2');
    const rTableBody = document.querySelector('#report-table tbody');
    const rRisk = document.getElementById('r-risk');
    
    if (rName) rName.textContent = profile.studentName || '—';
    if (rParents) rParents.textContent = 'Parents: ' + (profile.parentNames || '—');
    if (rAttendance) rAttendance.textContent = profile.attendance;
    
    const subjects = profile.subjects || [];
    if (rTableBody) {
        rTableBody.innerHTML = '';
        let total = 0;
        subjects.forEach(s => {
            const tr = document.createElement('tr');
            const nameTd = document.createElement('td');
            nameTd.textContent = s.name;
            const scoreTd = document.createElement('td');
            scoreTd.textContent = Number(s.score).toFixed(0);
            tr.appendChild(nameTd);
            tr.appendChild(scoreTd);
            rTableBody.appendChild(tr);
            total += Number(s.score || 0);
        });
        const avg = subjects.length ? (total / subjects.length) : 0;
        if (rTotal) rTotal.textContent = Math.round(total);
        if (rAvg2) rAvg2.textContent = Math.round(avg);
        if (rAverage) rAverage.textContent = Math.round(avg);
    }
}

// Load profile by name function
function loadProfileByName(name) {
    const raw = localStorage.getItem('edu_profiles');
    if (!raw) return alert('No saved profiles');
    const arr = JSON.parse(raw);
    const p = arr.find(x => x.studentName === name);
    if (!p) return alert('Student not found');
    populateForm(p);
}

// Enhanced form submission handler
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('profile-form');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            const profile = readForm();
            if (!profile.studentName) {
                alert('Please enter a student name.');
                return;
            }
            
            // Save the profile
            saveProfile(profile);
            
            // Update dashboard
            updateDashboardAndSnapshots();
            
            // Show the report page
            showPage('report');
            generateReport(profile);
            
            // Remove the setTimeout showAlerts call - let navigation handle it
        });
    }
    
    // Add subject functionality
    const addSubjectBtn = document.getElementById('add-subject');
    if (addSubjectBtn) {
        addSubjectBtn.addEventListener('click', () => {
            const subjectsList = document.getElementById('subjects-list');
            if (subjectsList) {
                const row = makeSubjectRow('', 0);
                subjectsList.appendChild(row);
            }
        });
    }
    
    // Attendance controls
    const attUp = document.getElementById('att-up');
    const attDown = document.getElementById('att-down');
    const attendanceInput = document.getElementById('attendance');
    
    if (attUp) {
        attUp.addEventListener('click', () => adjustAttendance(1));
    }
    if (attDown) {
        attDown.addEventListener('click', () => adjustAttendance(-1));
    }
    
    function adjustAttendance(delta) {
        if (attendanceInput) {
            let v = parseInt(attendanceInput.value || '0', 10) + delta;
            if (isNaN(v)) v = 0;
            v = Math.max(0, Math.min(31, v));
            attendanceInput.value = v;
        }
    }
    
    // Navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(a => {
        a.addEventListener('click', (e) => {
            e.preventDefault();
            const target = a.dataset.target;
            if (target === 'alerts') {
                showAlerts(); // Show alerts when navigating to alerts page
            }
            showPage(target);
        });
    });
    
    // CTA buttons
    const goProfile = document.getElementById('go-profile');
    const goDashboard = document.getElementById('go-dashboard');
    
    if (goProfile) {
        goProfile.addEventListener('click', () => showPage('profile'));
    }
    if (goDashboard) {
        goDashboard.addEventListener('click', () => showPage('dashboard'));
    }
    // === Initialize Performance Chart ===
const perfCanvas = document.getElementById('perfChart');
if (perfCanvas) {
    const ctx = perfCanvas.getContext('2d');

    function drawPerfChart() {
        const raw = localStorage.getItem('edu_profiles');
        const arr = raw ? JSON.parse(raw) : [];

        const averages = arr.map(p => {
            if (!p.subjects || p.subjects.length === 0) return 0;
            const total = p.subjects.reduce((sum, s) => sum + Number(s.score || 0), 0);
            return Math.round(total / p.subjects.length);
        });

        // If no data, draw empty chart
        if (averages.length === 0) {
            ctx.clearRect(0, 0, perfCanvas.width, perfCanvas.height);
            return;
        }

        // Draw simple bar chart
        const width = 40;
        const gap = 20;
        ctx.clearRect(0, 0, perfCanvas.width, perfCanvas.height);

        averages.forEach((avg, i) => {
            const x = i * (width + gap);
            const height = (avg / 100) * 140;

            ctx.fillStyle = "lightgreen";
            ctx.fillRect(x, 150 - height, width, height);
        });
    }

    drawPerfChart();

    // Redraw whenever data updates
    window.updateDashboardChart = drawPerfChart;
}

    
    // Initialize dashboard
    updateDashboardAndSnapshots();
});