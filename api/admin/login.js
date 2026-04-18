const { sendJson } = require("../cms/_airtable");
const { getAdminUserByEmail, issueSession, verifyPassword } = require("./_auth");
const { parseBody } = require("./_request");

module.exports = async (req, res) => {
    try {
        if (req.method !== "POST") {
            sendJson(res, 405, { error: "method_not_allowed" });
            return;
        }

        const { email, password } = await parseBody(req);
        const user = await getAdminUserByEmail(email);

        if (!user || !verifyPassword(password || "", user.passwordHash)) {
            sendJson(res, 401, {
                error: "invalid_credentials",
                message: "The email or password is incorrect."
            });
            return;
        }

        issueSession(res, user);
        sendJson(res, 200, {
            authenticated: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            }
        });
    } catch (error) {
        sendJson(res, error.statusCode || 500, {
            error: "login_failed",
            message: error.message
        });
    }
};
