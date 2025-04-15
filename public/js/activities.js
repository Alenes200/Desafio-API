const API_URL = 'http://localhost:3000';
const userEmail = localStorage.getItem('userEmail');
const token = localStorage.getItem('token');

// Verify login
if (!token || !userEmail) {
    window.location.href = '/index.html';
}

async function createActivity(event) {
    event.preventDefault();
    try {
        // ... existing createActivity code ...
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// ... remaining activity functions ...

// Load activities when page loads
document.addEventListener('DOMContentLoaded', loadActivities);
