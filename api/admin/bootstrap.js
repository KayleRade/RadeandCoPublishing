const { sendJson } = require("../cms/_airtable");
const { createAdminUser, getAdminUsers, issueSession } = require("./_auth");
const { parseBody } = require("./_request");

module.exports = async (req, res) => {
    try {
        if (req.method !== "POST") {
            sendJson(res, 405, { error: "method_not_allowed" });
            return;
        }

        const existingUsers = await getAdminUsers();
        if (existingUsers.length) {
            sendJson(res, 409, {
                error: "admin_exists",
                message: "An admin user has already been created."
            });
            return;
        }

        const { email, password } = await parseBody(req);
        if (!email || !password) {
            sendJson(res, 400, {
                error: "missing_fields",
                message: "Email and password are required."
            });
            return;
        }

        const user = await createAdminUser({ email, password });
        issueSession(res, user);
        sendJson(res, 200, {
            authenticated: true,
            user
        });
    } catch (error) {
        sendJson(res, error.statusCode || 500, {
            error: "bootstrap_failed",
            message: error.message
        });
    }
};
