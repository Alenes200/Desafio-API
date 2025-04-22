if (typeof API_URL === 'undefined') {
    const API_URL = "http://localhost:3000";
}

async function register() {
    try {
        const email = document.getElementById("registerEmail").value;
        const password = document.getElementById("registerPassword").value;

        if (!email || !password) {
            throw new Error("Por favor, preencha todos os campos!");
        }

        const response = await fetch(`${API_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        // ... remaining register function code ...
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// ... remaining auth functions ...
