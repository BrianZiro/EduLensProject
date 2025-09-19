/* EduLense AI — Frontend prototype JS
   - Handles navigation, profile save/load, attendance controls, subject management,
   - report calculation, alert generation and a small dashboard chart.
*/

//javaScript for toggle menu

var nav= document.getElementById ("navLinks"); 
function showMenu(){
    nav.style.right = "0";
}
function hideMenu(){ 
    nav.style.right = "-300px";
}

// Toggle dropdown on profile pic click
document.getElementById("profilePic").addEventListener("click", function () {
  const dropdown = document.getElementById("dropdownMenu");
  dropdown.style.display = dropdown.style.display === "flex" ? "none" : "flex";
});

// Close dropdown when clicking outside
document.addEventListener("click", function (event) {
  const dropdown = document.getElementById("dropdownMenu");
  const profilePic = document.getElementById("profilePic");

  if (!profilePic.contains(event.target) && !dropdown.contains(event.target)) {
    dropdown.style.display = "none";
  }
});


(() => {
    // Elements & state
    const pages = document.querySelectorAll('.page');
    const navLinks = document.querySelectorAll('.nav-link');
    const snapStudents = document.getElementById('snap-students');
    const snapAtRisk = document.getElementById('snap-at-risk');
    const snapReports = document.getElementById('snap-reports');

    // Profile form fields
    const form = document.getElementById('profile-form');
    const studentName = document.getElementById('studentName');
    const parentNames = document.getElementById('parentNames');
    const attendanceInput = document.getElementById('attendance');
    const attUp = document.getElementById('att-up');
    const attDown = document.getElementById('att-down');
    const disciplineInput = document.getElementById('discipline');
    const parentInvolvement = document.getElementById('parentInvolvement');
    const subjectsList = document.getElementById('subjects-list');
    const addSubjectBtn = document.getElementById('add-subject');
    const loadSample = document.getElementById('load-sample');
    const clearProfile = document.getElementById('clear-profile');

    // Report elements
    const rName = document.getElementById('r-name');
    const rParents = document.getElementById('r-parents');
    const rAttendance = document.getElementById('r-attendance');
    const rAverage = document.getElementById('r-average');
    const rTotal = document.getElementById('r-total');
    const rAvg2 = document.getElementById('r-avg-2');
    const rTableBody = document.querySelector('#report-table tbody');
    const rRisk = document.getElementById('r-risk');
    const generateReportBtn = document.getElementById('generate-report');
    const downloadReportBtn = document.getElementById('download-report');

    // Alerts area
    const alertsOutput = document.getElementById('alerts-output');

    // Dashboard
    const dashStudents = document.getElementById('dash-students');
    const dashRisk = document.getElementById('dash-risk');
    const dashReports = document.getElementById('dash-reports');
    const perfCanvas = document.getElementById('perfChart');
    const perfCtx = perfCanvas.getContext('2d');

    // Settings
    const uiTheme = document.getElementById('uiTheme');
    const thAtt = document.getElementById('th-att');
    const thScore = document.getElementById('th-score');
    const thDiscipline = document.getElementById('th-discipline');
    const saveSettings = document.getElementById('save-settings');
    const resetSettings = document.getElementById('reset-settings');

    // CTA buttons from home
    document.getElementById('go-profile').addEventListener('click', () => showPage('profile'));
    document.getElementById('go-dashboard').addEventListener('click', () => showPage('dashboard'));

    // Navigation
    navLinks.forEach(a => {
        a.addEventListener('click', (e) => {
            e.preventDefault();
            const target = a.dataset.target;
            showPage(target);
        });
    });

    function showPage(id) {
        pages.forEach(p => p.id === id ? p.classList.add('active') : p.classList.remove('active'));
        // update active nav style
        navLinks.forEach(n => n.classList.toggle('active', n.dataset.target === id));
    }

    // Attendance plus/minus
    attUp.addEventListener('click', () => adjustAttendance(1));
    attDown.addEventListener('click', () => adjustAttendance(-1));
    function adjustAttendance(delta) {
        let v = parseInt(attendanceInput.value || '0', 10) + delta;
        if (isNaN(v)) v = 0;
        v = Math.max(0, Math.min(31, v));
        attendanceInput.value = v;
    }

    // Subjects dynamic
    addSubjectBtn.addEventListener('click', () => {
        const row = makeSubjectRow('', 0);
        subjectsList.appendChild(row);
    });

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

    // Form submit -> save profile
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const profile = readForm();
        if (!profile.studentName) {
            alert('Please enter a student name.');
            return;
        }
        saveProfile(profile);
        updateDashboardAndSnapshots();
        showPage('report');
        generateReport(profile);
    });

    loadSample.addEventListener('click', () => {
        const sample = {
            studentName: 'Grace Akoth',
            parentNames: 'John & Mary Akoth',
            attendance: 18,
            discipline: 3,
            parentInvolvement: 'medium',
            subjects: [
                { name: 'Mathematics', score: 48 },
                { name: 'English', score: 52 },
                { name: 'Science', score: 45 }
            ]
        };
        populateForm(sample);
    });

    clearProfile.addEventListener('click', () => {
        if (confirm('Clear the profile form?')) {
            populateForm(emptyProfile());
        }
    });

    // generate report
    generateReportBtn.addEventListener('click', () => {
        const profile = readForm();
        if (!profile.studentName) return alert('No student data in form to generate report. Save or fill the form first.');
        generateReport(profile);
    });

    downloadReportBtn.addEventListener('click', () => {
        const profile = readForm();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(profile, null, 2));
        const dl = document.createElement('a');
        dl.setAttribute('href', dataStr);
        dl.setAttribute('download', `${profile.studentName || 'student'}-report.json`);
        document.body.appendChild(dl);
        dl.click();
        dl.remove();
    });

    // Settings
    saveSettings.addEventListener('click', () => {
        const s = {
            theme: uiTheme.value,
            thAtt: parseFloat(thAtt.value),
            thScore: parseFloat(thScore.value),
            thDiscipline: parseFloat(thDiscipline.value)
        };
        localStorage.setItem('edu_settings', JSON.stringify(s));
        applySettings(s);
        alert('Settings saved');
    });

    resetSettings.addEventListener('click', () => {
        localStorage.removeItem('edu_settings');
        loadSettings();
        alert('Settings reset');
    });

    function applySettings(s) {
        if (s.theme === 'light') {
            document.documentElement.style.setProperty('--bg', '#f6f8fb');
            document.documentElement.style.setProperty('--card', '#ffffff');
            document.documentElement.style.setProperty('--white', '#0b1a2b');
        } else {
            // default dark
            document.documentElement.style.removeProperty('--bg');
            document.documentElement.style.removeProperty('--card');
            document.documentElement.style.removeProperty('--white');
        }
    }

    function loadSettings() {
        const raw = localStorage.getItem('edu_settings');
        let s;
        if (raw) {
            s = JSON.parse(raw);
        } else {
            s = { theme: 'dark', thAtt: 75, thScore: 50, thDiscipline: 5 };
        }
        uiTheme.value = s.theme;
        thAtt.value = s.thAtt;
        thScore.value = s.thScore;
        thDiscipline.value = s.thDiscipline;
        applySettings(s);
    }

    // Utilities: read and populate form
    function readForm() {
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
        studentName.value = p.studentName || '';
        parentNames.value = p.parentNames || '';
        attendanceInput.value = p.attendance != null ? p.attendance : 0;
        disciplineInput.value = p.discipline != null ? p.discipline : 0;
        parentInvolvement.value = p.parentInvolvement || 'medium';
        subjectsList.innerHTML = '';
        (p.subjects || []).forEach(s => subjectsList.appendChild(makeSubjectRow(s.name, s.score)));
        // ensure at least one row
        if (subjectsList.children.length === 0) subjectsList.appendChild(makeSubjectRow('Mathematics', 0));
    }

    function emptyProfile() {
        return {
            studentName: '',
            parentNames: '',
            attendance: 0,
            discipline: 0,
            parentInvolvement: 'medium',
            subjects: []
        };
    }

    function saveProfile(profile) {
        // store in localStorage; we keep profiles in an array
        const raw = localStorage.getItem('edu_profiles');
        const arr = raw ? JSON.parse(raw) : [];
        // if same name exists, replace
        const idx = arr.findIndex(p => p.studentName === profile.studentName);
        if (idx >= 0) arr[idx] = profile;
        else arr.push(profile);
        localStorage.setItem('edu_profiles', JSON.stringify(arr));
        // update UI counters
        updateDashboardAndSnapshots();
    }

    // Alerts: simple heuristic evaluation for dropout risk
    function computeRisk(profile) {
        const settingsRaw = localStorage.getItem('edu_settings');
        const settings = settingsRaw ? JSON.parse(settingsRaw) : { thAtt: 75, thScore: 50, thDiscipline: 5 };
        // attendance percent out of 31
        const attendancePct = (profile.attendance / 31) * 100;
        const avg = profile.subjects && profile.subjects.length ? (profile.subjects.reduce((s, x) => s + x.score, 0) / profile.subjects.length) : 100;
        let riskScore = 0;
        if (attendancePct < settings.thAtt) riskScore += 2;
        if (avg < settings.thScore) riskScore += 2;
        if (profile.discipline > settings.thDiscipline) riskScore += 1;
        if (profile.parentInvolvement === 'low') riskScore += 1;
        // interpret
        let riskLabel = 'Low';
        if (riskScore >= 4) riskLabel = 'High';
        else if (riskScore >= 2) riskLabel = 'Medium';
        return { riskLabel, attendancePct: Math.round(attendancePct), avg: Math.round(avg), riskScore };
    }

    function showAlerts() {
        alertsOutput.innerHTML = '';
        const raw = localStorage.getItem('edu_profiles');
        if (!raw) {
            alertsOutput.innerHTML = '<p class="muted">No student profiles saved yet.</p>';
            return;
        }
        const arr = JSON.parse(raw);
        const high = [];
        arr.forEach(p => {
            const r = computeRisk(p);
            if (r.riskLabel === 'High') high.push({ p, r });
            const div = document.createElement('div');
            div.className = (r.riskLabel === 'High') ? 'alert' : 'success-alert';
            div.innerHTML = `<strong>${escapeHtml(p.studentName)}</strong> — Risk: ${r.riskLabel}
        <div class="muted small">Attendance: ${r.attendancePct}% • Avg: ${r.avg} • Discipline: ${p.discipline}</div>
        <div style="margin-top:8px"><button class="btn-ghost small" data-name="${escapeHtml(p.studentName)}">View Report</button></div>`;
            alertsOutput.appendChild(div);
        });
        // hook view report buttons
        alertsOutput.querySelectorAll('button[data-name]').forEach(b => {
            b.addEventListener('click', () => {
                const name = b.dataset.name;
                loadProfileByName(name);
                showPage('report');
                generateReport(readForm());
            });
        });
    }

    // Report generation: fill table and totals
    function generateReport(profile) {
        rName.textContent = profile.studentName || '—';
        rParents.textContent = 'Parents: ' + (profile.parentNames || '—');
        rAttendance.textContent = profile.attendance;
        const subjects = profile.subjects || [];
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
        rTotal.textContent = Math.round(total);
        rAvg2.textContent = Math.round(avg);
        rAverage.textContent = Math.round(avg);
        const risk = computeRisk(profile);
        rRisk.textContent = `${risk.riskLabel}`;
        // update counters
        incrementReportsCounter();
    }

    // Dashboard helpers
    function updateDashboardAndSnapshots() {
        const raw = localStorage.getItem('edu_profiles');
        const arr = raw ? JSON.parse(raw) : [];
        const reportsRaw = localStorage.getItem('edu_reports_count');
        const reportsCount = reportsRaw ? parseInt(reportsRaw, 10) : 0;
        const atRisk = arr.reduce((s, p) => s + (computeRisk(p).riskLabel === 'High' ? 1 : 0), 0);
        snapStudents.textContent = arr.length;
        snapAtRisk.textContent = atRisk;
        snapReports.textContent = reportsCount;
        dashStudents.textContent = arr.length;
        dashRisk.textContent = atRisk;
        dashReports.textContent = reportsCount;
        drawPerfChart(arr);
    }

    function drawPerfChart(profiles) {
        // small canvas bar chart of average per student
        const ctx = perfCtx;
        const w = perfCanvas.width;
        const h = perfCanvas.height;
        ctx.clearRect(0, 0, w, h);
        if (!profiles || profiles.length === 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.06)';
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fillText('No data', 10, 20);
            return;
        }
        const avgs = profiles.map(p => {
            const s = p.subjects || [];
            return s.length ? s.reduce((a, b) => a + b.score, 0) / s.length : 0;
        });
        const max = Math.max(...avgs, 100);
        const barW = Math.max(6, Math.floor(w / (avgs.length * 2)));
        avgs.forEach((val, i) => {
            const x = 10 + i * (barW + 8);
            const barH = (val / max) * (h - 30);
            ctx.fillStyle = 'rgba(27,107,216,0.9)';
            ctx.fillRect(x, h - barH - 10, barW, barH);
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.font = '11px sans-serif';
            ctx.fillText(Math.round(val), x, h - barH - 14);
        });
    }

    // Load single profile into form by name
    function loadProfileByName(name) {
        const raw = localStorage.getItem('edu_profiles');
        if (!raw) return alert('No saved profiles');
        const arr = JSON.parse(raw);
        const p = arr.find(x => x.studentName === name);
        if (!p) return alert('Student not found');
        populateForm(p);
    }

    function incrementReportsCounter() {
        const raw = localStorage.getItem('edu_reports_count');
        const curr = raw ? parseInt(raw, 10) : 0;
        localStorage.setItem('edu_reports_count', String(curr + 1));
        updateDashboardAndSnapshots();
    }

    // Helpers: escape and simple HTML sanitize for inserting into innerHTML
    function escapeHtml(s) {
        return String(s || '').replace(/[&<>"'`]/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;'
        })[c]);
    }

    // initial load
    loadSettings();
    updateDashboardAndSnapshots();
    showAlerts();

    // Recompute alerts when leaving profile saved or storage changed
    window.addEventListener('storage', () => {
        updateDashboardAndSnapshots();
        showAlerts();
    });

    // On page load put a default subject row if none present
    if (subjectsList.children.length === 0) {
        subjectsList.appendChild(makeSubjectRow('Mathematics', 60));
    }

    // small UI polish: clicking Save Profile also shows alerts updated
    // Add simple autosave: when the form changes (after small delay) save to localStorage (draft)
    let draftTimer;
    form.addEventListener('input', () => {
        if (draftTimer) clearTimeout(draftTimer);
        draftTimer = setTimeout(() => {
            const draft = readForm();
            localStorage.setItem('edu_draft', JSON.stringify(draft));
        }, 700);
    });

    // On load, restore draft
    const draft = localStorage.getItem('edu_draft');
    if (draft) {
        try {
            const p = JSON.parse(draft);
            if (p && !p.studentName) {
                // keep draft but do not auto-populate if user already started
            } else {
                // we won't auto overwrite an active form; but give an option
                // For simplicity, add a button that allows restore (UI minimal)
            }
        } catch (e) { }
    }

    // when user opens Alerts or Dashboard pages, refresh alerts/dashboard
    document.querySelectorAll('[data-target="alerts"], [data-target="dashboard"]').forEach(n => n.addEventListener('click', () => {
        updateDashboardAndSnapshots();
        showAlerts();
    }));

    // expose a global helper to quickly clear storage (dev only)
    window.__edu_clear_all = function () {
        if (confirm('Clear all EduLense demo storage?')) {
            localStorage.removeItem('edu_profiles');
            localStorage.removeItem('edu_reports_count');
            localStorage.removeItem('edu_settings');
            localStorage.removeItem('edu_draft');
            updateDashboardAndSnapshots();
            showAlerts();
            alert('Cleared.');
        }
    };

    function toggleDropdown() {
      const dropdown = document.getElementById("profileDropdown");
      dropdown.style.display =
        dropdown.style.display === "block" ? "none" : "block";
    }

    function closeDropdown() {
      document.getElementById("profileDropdown").style.display = "none";
    }

    // Optional: close dropdown if clicked outside
    document.addEventListener("click", function (event) {
      const dropdown = document.getElementById("profileDropdown");
      const trigger = document.querySelector(".profile-trigger");

      if (!trigger.contains(event.target) && !dropdown.contains(event.target)) {
        dropdown.style.display = "none";
      }
    });

})();

// === THEME TOGGLE FROM SETTINGS ===
const themeToggle = document.getElementById("themeToggle");
const body = document.body;

// Load saved theme (default = dark)
let savedTheme = localStorage.getItem("theme");

if (savedTheme === "light") {
  body.classList.add("light-mode");
  themeToggle.textContent = "🌙 Dark Mode";
} else {
  body.classList.remove("light-mode"); // default = dark
  themeToggle.textContent = "☀️ Light Mode";
}

// Toggle theme on button click
themeToggle.addEventListener("click", () => {
  if (body.classList.contains("light-mode")) {
    body.classList.remove("light-mode"); // back to dark
    themeToggle.textContent = "☀️ Light Mode";
    localStorage.setItem("theme", "dark");
  } else {
    body.classList.add("light-mode"); // switch to light
    themeToggle.textContent = "🌙 Dark Mode";
    localStorage.setItem("theme", "light");
  }
});



