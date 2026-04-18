const {
    getConfig,
    fetchAllRecords,
    createRecord,
    updateRecord,
    deleteRecord,
    mapAnnouncementRecord,
    sendJson
} = require("../cms/_airtable");
const { ensureAuthenticated } = require("./_auth");
const { parseBody } = require("./_request");

function toAnnouncementFields(payload) {
    return {
        Text: payload.text || "",
        Link: payload.link || "",
        Active: Boolean(payload.active)
    };
}

module.exports = async (req, res) => {
    try {
        await ensureAuthenticated(req);
        const config = getConfig();

        if (req.method === "GET") {
            const records = await fetchAllRecords(config.announcementsTable);
            sendJson(res, 200, records.map(mapAnnouncementRecord));
            return;
        }

        if (req.method === "POST") {
            const payload = await parseBody(req);
            const record = await createRecord(config.announcementsTable, toAnnouncementFields(payload));
            sendJson(res, 200, mapAnnouncementRecord(record));
            return;
        }

        if (req.method === "PUT") {
            const payload = await parseBody(req);
            if (!payload.id) {
                sendJson(res, 400, { error: "missing_id" });
                return;
            }
            const record = await updateRecord(config.announcementsTable, payload.id, toAnnouncementFields(payload));
            sendJson(res, 200, mapAnnouncementRecord(record));
            return;
        }

        if (req.method === "DELETE") {
            const payload = await parseBody(req);
            if (!payload.id) {
                sendJson(res, 400, { error: "missing_id" });
                return;
            }
            await deleteRecord(config.announcementsTable, payload.id);
            sendJson(res, 200, { deleted: true });
            return;
        }

        sendJson(res, 405, { error: "method_not_allowed" });
    } catch (error) {
        sendJson(res, error.statusCode || 500, {
            error: "announcements_admin_failed",
            message: error.message
        });
    }
};
