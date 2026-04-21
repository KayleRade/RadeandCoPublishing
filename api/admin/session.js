const { sendJson } = require("../cms/_airtable");
const { ensureAuthenticated, getAdminUsers } = require("./_auth");

module.exports = async (req, res) => {
    try {
        const user = await ensureAuthenticated(req);
        const users = await getAdminUsers();
        sendJson(res, 200, {
            authenticated: true,
            needsBootstrap: users.length === 0,
            setupAvailable: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            }
        });
    } catch (error) {
        let users = [];
        let setupAvailable = true;
        let message = "";

        try {
            users = await getAdminUsers();
        } catch (lookupError) {
            setupAvailable = false;
            message = lookupError.message || "Admin setup is not available.";
        }

        sendJson(res, 200, {
            authenticated: false,
            needsBootstrap: setupAvailable && users.length === 0,
            setupAvailable,
            message
        });
    }
};
