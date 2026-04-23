const { sendJson } = require("../cms/_airtable");
const { recordPageView } = require("../admin/_analytics");

function readJsonBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on("data", (chunk) => chunks.push(chunk));
        req.on("end", () => {
            try {
                const raw = Buffer.concat(chunks).toString("utf8") || "{}";
                resolve(JSON.parse(raw));
            } catch (error) {
                reject(error);
            }
        });
        req.on("error", reject);
    });
}

module.exports = async (req, res) => {
    try {
        if (req.method !== "POST") {
            sendJson(res, 405, { error: "method_not_allowed" });
            return;
        }

        const payload = req.body && typeof req.body === "object" ? req.body : await readJsonBody(req);
        const pathname = String(payload.path || "").trim();
        const title = String(payload.title || "").trim();
        const visitorId = String(payload.visitorId || "").trim();

        if (!pathname || !visitorId) {
            sendJson(res, 400, {
                error: "missing_fields",
                message: "Path and visitorId are required."
            });
            return;
        }

        recordPageView({
            path: pathname,
            title,
            visitorId
        });

        sendJson(res, 200, { success: true });
    } catch (error) {
        sendJson(res, 500, {
            error: "analytics_failed",
            message: error.message || "Analytics recording failed."
        });
    }
};
