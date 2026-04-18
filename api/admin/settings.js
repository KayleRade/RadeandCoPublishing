const {
    getConfig,
    fetchAllRecords,
    createRecord,
    updateRecord,
    mapSiteSettingsRecord,
    sendJson
} = require("../cms/_airtable");
const { ensureAuthenticated, updateAdminCredentials } = require("./_auth");
const { parseBody } = require("./_request");

function toSettingsFields(payload) {
    return {
        "Site Title": payload.siteTitle || "Rade & Co Publishing",
        "Footer Text": payload.footerText || "",
        "Contact Email": payload.contactEmail || "",
        "Instagram URL": payload.instagramUrl || "",
        "Facebook URL": payload.facebookUrl || "",
        "YouTube URL": payload.youtubeUrl || "",
        "Amazon Author URL": payload.amazonAuthorUrl || "",
        "TikTok URL": payload.tiktokUrl || ""
    };
}

module.exports = async (req, res) => {
    try {
        const user = await ensureAuthenticated(req);
        const config = getConfig();

        if (req.method === "GET") {
            const records = await fetchAllRecords(config.siteSettingsTable);
            sendJson(res, 200, records[0] ? mapSiteSettingsRecord(records[0]) : null);
            return;
        }

        if (req.method === "PUT") {
            const payload = await parseBody(req);
            const records = await fetchAllRecords(config.siteSettingsTable);
            let record;
            if (records[0]) {
                record = await updateRecord(config.siteSettingsTable, records[0].id, toSettingsFields(payload));
            } else {
                record = await createRecord(config.siteSettingsTable, toSettingsFields(payload));
            }

            if (payload.adminEmail || payload.adminPassword || payload.adminName) {
                await updateAdminCredentials(user.id, {
                    email: payload.adminEmail,
                    password: payload.adminPassword,
                    name: payload.adminName
                });
            }

            sendJson(res, 200, mapSiteSettingsRecord(record));
            return;
        }

        sendJson(res, 405, { error: "method_not_allowed" });
    } catch (error) {
        sendJson(res, error.statusCode || 500, {
            error: "settings_admin_failed",
            message: error.message
        });
    }
};
