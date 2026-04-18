const {
    getConfig,
    fetchAllRecords,
    createRecord,
    updateRecord,
    deleteRecord,
    mapMediaRecord,
    sendJson
} = require("../cms/_airtable");
const { ensureAuthenticated } = require("./_auth");
const { parseBody } = require("./_request");

function toMediaFields(payload) {
    return {
        Title: payload.title || "",
        Category: payload.category || "",
        "Image URL": payload.imageUrl || "",
        "Alt Text": payload.altText || ""
    };
}

module.exports = async (req, res) => {
    try {
        await ensureAuthenticated(req);
        const config = getConfig();

        if (req.method === "GET") {
            const records = await fetchAllRecords(config.mediaLibraryTable);
            sendJson(res, 200, records.map(mapMediaRecord));
            return;
        }

        if (req.method === "POST") {
            const payload = await parseBody(req);
            const record = await createRecord(config.mediaLibraryTable, toMediaFields(payload));
            sendJson(res, 200, mapMediaRecord(record));
            return;
        }

        if (req.method === "PUT") {
            const payload = await parseBody(req);
            if (!payload.id) {
                sendJson(res, 400, { error: "missing_id" });
                return;
            }
            const record = await updateRecord(config.mediaLibraryTable, payload.id, toMediaFields(payload));
            sendJson(res, 200, mapMediaRecord(record));
            return;
        }

        if (req.method === "DELETE") {
            const payload = await parseBody(req);
            if (!payload.id) {
                sendJson(res, 400, { error: "missing_id" });
                return;
            }
            await deleteRecord(config.mediaLibraryTable, payload.id);
            sendJson(res, 200, { deleted: true });
            return;
        }

        sendJson(res, 405, { error: "method_not_allowed" });
    } catch (error) {
        sendJson(res, error.statusCode || 500, {
            error: "media_admin_failed",
            message: error.message
        });
    }
};
