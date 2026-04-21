(function () {
    const authForm = document.getElementById("authForm");
    const authTitle = document.getElementById("authTitle");
    const authIntro = document.getElementById("authIntro");
    const authSubmit = document.getElementById("authSubmit");
    const authStatus = document.getElementById("authStatus");
    const authAlert = document.getElementById("authAlert");
    const isGitHubPages = /github\.io$/i.test(window.location.hostname);

    let bootstrapMode = false;

    function setStatus(message, type) {
        authStatus.textContent = message || "";
        authStatus.classList.toggle("is-error", type === "error");
    }

    function setAlert(message) {
        if (!authAlert) {
            return;
        }
        if (!message) {
            authAlert.textContent = "";
            authAlert.classList.add("admin-hidden");
            return;
        }
        authAlert.textContent = message;
        authAlert.classList.remove("admin-hidden");
    }

    async function request(path, options) {
        const response = await fetch(path, {
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json"
            },
            ...options
        });

        const contentType = response.headers.get("content-type") || "";
        let data;
        if (contentType.includes("application/json")) {
            data = await response.json();
        } else {
            const text = await response.text();
            if (/^\s*</.test(text)) {
                throw new Error("The admin backend is not available on this site right now.");
            }
            throw new Error(text || "The server returned an unexpected response.");
        }

        if (!response.ok) {
            throw new Error(data.message || "Request failed.");
        }
        return data;
    }

    async function checkSession() {
        if (isGitHubPages) {
            setAlert("Admin login is not available on GitHub Pages. The public site can live here, but the admin dashboard needs a backend host such as Hostinger or Vercel.");
        }

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
        setStatus("Working...");
        setAlert(isGitHubPages ? "Admin login is not available on GitHub Pages. Deploy the backend-enabled version to Hostinger or Vercel to sign in." : "");

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
            setStatus(error.message, "error");
        }
    });

    checkSession().catch((error) => {
        setStatus(error.message, "error");
    });
})();
