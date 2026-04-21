(function () {
    const authForm = document.getElementById("authForm");
    const authTitle = document.getElementById("authTitle");
    const authIntro = document.getElementById("authIntro");
    const authSubmit = document.getElementById("authSubmit");
    const authStatus = document.getElementById("authStatus");

    let bootstrapMode = false;

    async function request(path, options) {
        const response = await fetch(path, {
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json"
            },
            ...options
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || "Request failed.");
        }
        return data;
    }

    async function checkSession() {
        const session = await request("../api/admin/session");
        if (session.authenticated) {
            window.location.href = "./index.html";
            return;
        }

        bootstrapMode = Boolean(session.needsBootstrap);
        if (bootstrapMode) {
            authTitle.textContent = "Create your admin login";
            authIntro.textContent = "This one-time setup creates the first secure admin user for the dashboard using your email and password.";
            authSubmit.textContent = "Create Admin Login";
        }
    }

    authForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        authStatus.textContent = "Working...";

        const formData = new FormData(authForm);
        const payload = {
            email: formData.get("email"),
            password: formData.get("password")
        };

        try {
            await request(`../api/admin/${bootstrapMode ? "bootstrap" : "login"}`, {
                method: "POST",
                body: JSON.stringify(payload)
            });
            window.location.href = "./index.html";
        } catch (error) {
            authStatus.textContent = error.message;
        }
    });

    checkSession().catch((error) => {
        authStatus.textContent = error.message;
    });
})();
