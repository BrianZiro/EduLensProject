// Handle form submission
document.getElementById('studentForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const studentName = document.getElementById('studentName').value;
  const attendance = document.getElementById('attendance').value;
  const testScore = document.getElementById('testScore').value;
  const discipline = document.getElementById('discipline').value;
  const parentalInvolvement = document.getElementById('parentalInvolvement').value;
  const phone = document.getElementById("phone").value;


  // Logic for dropout risk prediction (simplified)
  let riskLevel = "Low";
  if (attendance < 70 || testScore < 50 || discipline > 2) {
    riskLevel = "High";
  } else if (attendance < 85 || testScore < 60) {
    riskLevel = "Medium";
  }

  // Create a new student card with the risk level
  const studentCard = document.createElement('div');
  studentCard.classList.add('card');
  
  studentCard.innerHTML = `
    <h3>${studentName}</h3>
    <p>Attendance: ${attendance}%</p>
    <p>Test Score: ${testScore}</p>
    <p>Discipline: ${discipline}</p>
    <p>Parental Involvement: ${parentalInvolvement}</p>
    <p class="risk-level" style="color:${riskLevel === 'High' ? '#F44336' : (riskLevel === 'Medium' ? '#FF9800' : '#4CAF50')}">${riskLevel} Risk</p>
    <button class="button" onclick="sendSimulatedSMS('${studentName}')">Simulate SMS</button>
  `;


  // Append the card to the student profiles section
  document.getElementById('studentCards').appendChild(studentCard);
});

// Simulate SMS alert function
function sendSimulatedSMS(studentName) {
  alert(`📱 Simulated SMS: ${studentName} is at high risk of dropping out. Please follow up.`);
}
