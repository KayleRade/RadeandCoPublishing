const {
    getConfig,
    fetchAllRecords,
    createRecord,
    updateRecord,
    mapHomepageRecord,
    sendJson
} = require("../cms/_airtable");
const { ensureAuthenticated } = require("./_auth");
const { parseBody } = require("./_request");

function toHomepageFields(payload) {
    return {
        "Hero Headline": payload.heroHeadline || "",
        "Hero Subheadline": payload.heroSubheadline || "",
        "Featured Bestseller Slug": payload.bestsellerSlug || "",
        "New Release Slug": payload.newReleaseSlug || "",
        "Category Section Text": payload.categorySectionText || "",
        "Professional Tools Text": payload.professionalToolsText || "",
        "Kids & Family Text": payload.kidsFamilyText || "",
        "Journals & Wellness Text": payload.journalsWellnessText || "",
        "Organizing Text": payload.organizingText || ""
    };
}

module.exports = async (req, res) => {
    try {
        await ensureAuthenticated(req);
        const config = getConfig();

        if (req.method === "GET") {
            const records = await fetchAllRecords(config.homepageTable);
            sendJson(res, 200, records[0] ? mapHomepageRecord(records[0]) : null);
            return;
        }

        if (req.method === "PUT") {
            const payload = await parseBody(req);
            const records = await fetchAllRecords(config.homepageTable);
            let record;
            if (records[0]) {
                record = await updateRecord(config.homepageTable, records[0].id, toHomepageFields(payload));
            } else {
                record = await createRecord(config.homepageTable, toHomepageFields(payload));
            }
            sendJson(res, 200, mapHomepageRecord(record));
            return;
        }

        sendJson(res, 405, { error: "method_not_allowed" });
    } catch (error) {
        sendJson(res, error.statusCode || 500, {
            error: "homepage_admin_failed",
            message: error.message
        });
    }
};
