(function () {
    const authForm = document.getElementById("authForm");
    const authTitle = document.getElementById("authTitle");
    const authIntro = document.getElementById("authIntro");
    const authSubmit = document.getElementById("authSubmit");
    const authStatus = document.getElementById("authStatus");
    const authAlert = document.getElementById("authAlert");
    const passwordToggle = document.getElementById("passwordToggle");
    const passwordInput = document.getElementById("adminPassword");
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

    function formatErrorMessage(message) {
        const text = String(message || "").trim();
        if (!text) {
            return "Something went wrong. Please try again.";
        }
        if (text.includes("INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND") || text.includes("Invalid permissions")) {
            return "Airtable access is not configured correctly yet. Please verify that your Personal Access Token has record read/write access and that this base includes the expected tables.";
        }
        if (text.includes("Missing required environment variable")) {
            return "The admin backend is missing required environment settings. Please check the VPS .env file and restart the container.";
        }
        return text;
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

        bootstrapMode = Boolean(session.needsBootstrap && session.setupAvailable !== false);
        if (session.setupAvailable === false && session.message) {
            setAlert(formatErrorMessage(session.message));
            authTitle.textContent = "Sign in to manage your site";
            authIntro.textContent = "Use your admin email and password to update books, blog posts, homepage content, announcements, and settings.";
            authSubmit.textContent = "Sign In";
            return;
        }

        if (bootstrapMode) {
            authTitle.textContent = "Create your admin login";
            authIntro.textContent = "This one-time setup creates the first secure admin user for the dashboard using your email and password.";
            authSubmit.textContent = "Create Admin Login";
        } else {
            authTitle.textContent = "Sign in to manage your site";
            authIntro.textContent = "Use your admin email and password to update books, blog posts, homepage content, announcements, and settings.";
            authSubmit.textContent = "Sign In";
        }
    }

    if (passwordToggle && passwordInput) {
        passwordToggle.addEventListener("click", () => {
            const showing = passwordInput.type === "text";
            passwordInput.type = showing ? "password" : "text";
            passwordToggle.setAttribute("aria-pressed", String(!showing));
            passwordToggle.setAttribute("aria-label", showing ? "Show password" : "Hide password");
            passwordToggle.querySelector(".admin-password-toggle-show").classList.toggle("admin-hidden", !showing);
            passwordToggle.querySelector(".admin-password-toggle-hide").classList.toggle("admin-hidden", showing);
        });
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
            setStatus(formatErrorMessage(error.message), "error");
        }
    });

    checkSession().catch((error) => {
        setStatus(formatErrorMessage(error.message), "error");
    });
})();
