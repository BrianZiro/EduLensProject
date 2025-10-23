document.addEventListener("DOMContentLoaded", function () {
  document.getElementById('studentForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const studentName = document.getElementById('studentName').value;
    const attendance = document.getElementById('attendance').value;
    const testScore = document.getElementById('testScore').value;
    const discipline = document.getElementById('discipline').value;
    const parentalInvolvement = document.getElementById('parentalInvolvement').value;
    const phone = document.getElementById("phone").value;

    try {
      // Call your Django AI endpoint
      const response = await fetch('/predict/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
          attendance: parseFloat(attendance),
          test_score: parseFloat(testScore),
          parental_involvement: parentalInvolvement === 'high' ? 3 : 
                               parentalInvolvement === 'medium' ? 2 : 1,
          discipline_count: parseInt(discipline)
        })
      });

      const result = await response.json();
      
      if (result.success) {
        const riskLevel = result.risk_level;
        
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

        document.getElementById('studentCards').appendChild(studentCard);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('AI prediction failed:', error);
      alert('Failed to get AI prediction. Please try again.');
    }
  });
});

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