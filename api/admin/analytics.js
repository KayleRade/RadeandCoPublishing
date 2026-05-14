const { ensureAuthenticated } = require("./_auth");
const { sendJson } = require("../cms/_airtable");
const { getAnalyticsSummary } = require("./_analytics");

module.exports = async (req, res) => {
    try {
        await ensureAuthenticated(req);

        if (req.method !== "GET") {
            sendJson(res, 405, { error: "method_not_allowed" });
            return;
        }

        sendJson(res, 200, getAnalyticsSummary({
            year: req.query && req.query.year,
            month: req.query && req.query.month
        }));
    } catch (error) {
        sendJson(res, error.statusCode || 500, {
            error: "analytics_admin_failed",
            message: error.message
        });
    }
};
