const { sendJson } = require("../cms/_airtable");
const { clearCookie } = require("./_auth");

module.exports = async (req, res) => {
    clearCookie(res);
    sendJson(res, 200, { authenticated: false });
};
