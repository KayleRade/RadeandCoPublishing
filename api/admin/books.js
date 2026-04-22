const {
    getConfig,
    fetchAllRecords,
    createRecord,
    updateRecord,
    deleteRecord,
    mapBookRecord,
    sendJson
} = require("../cms/_airtable");
const { ensureAuthenticated } = require("./_auth");
const { parseBody } = require("./_request");

function slugify(value) {
    const candidate = String(value || "")
        .split(/[,:|–—]/)[0]
        .trim()
        .split(/\s+/)
        .slice(0, 8)
        .join(" ");

    return candidate
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .replace(/-{2,}/g, "-");
}

function toBookFields(payload) {
    const slug = slugify(payload.slug || payload.title);
    return {
        Title: payload.title || "",
        Category: payload.category || "",
        "Amazon URL": payload.amazonUrl || "",
        "Cover Image URL": payload.coverImage || "",
        "Short Description": payload.shortDescription || "",
        "Long Description": payload.longDescription || "",
        Rating: payload.rating === "" || payload.rating == null ? null : Number(payload.rating),
        "Review Count": payload.reviewCount === "" || payload.reviewCount == null ? null : Number(payload.reviewCount),
        Featured: Boolean(payload.featured),
        "New Release": Boolean(payload.newRelease),
        Series: Boolean(payload.series),
        Author: payload.author || "Kate Rade",
        Slug: slug,
        "Hero Stat 1": payload.heroStatOne || "",
        "Hero Stat 2": payload.heroStatTwo || "",
        "Gallery Images": payload.galleryImages || "",
        "Trim Size": payload.trimSize || "",
        "Page Count": payload.pageCount || "",
        "Paper Type": payload.paperType || "",
        "Binding Type": payload.bindingType || "",
        "Book Video URL": payload.videoUrl || "",
        "Free Bonus Title": payload.freeBonusTitle || "",
        "Free Bonus File URL": payload.freeBonusFileUrl || "",
        "Who This Book Is For": payload.audience || "",
        "Problem It Solves": payload.problem || "",
        "Reader Outcome": payload.outcome || "",
        "Review Headline": payload.reviewHeadline || "",
        "Review Snippet": payload.reviewSnippet || ""
    };
}

module.exports = async (req, res) => {
    try {
        await ensureAuthenticated(req);
        const config = getConfig();

        if (req.method === "GET") {
            const records = await fetchAllRecords(config.booksTable);
            sendJson(res, 200, records.map(mapBookRecord));
            return;
        }

        if (req.method === "POST") {
            const payload = await parseBody(req);
            const record = await createRecord(config.booksTable, toBookFields(payload));
            sendJson(res, 200, mapBookRecord(record));
            return;
        }

        if (req.method === "PUT") {
            const payload = await parseBody(req);
            if (!payload.id) {
                sendJson(res, 400, { error: "missing_id" });
                return;
            }
            const record = await updateRecord(config.booksTable, payload.id, toBookFields(payload));
            sendJson(res, 200, mapBookRecord(record));
            return;
        }

        if (req.method === "DELETE") {
            const payload = await parseBody(req);
            if (!payload.id) {
                sendJson(res, 400, { error: "missing_id" });
                return;
            }
            await deleteRecord(config.booksTable, payload.id);
            sendJson(res, 200, { deleted: true });
            return;
        }

        sendJson(res, 405, { error: "method_not_allowed" });
    } catch (error) {
        sendJson(res, error.statusCode || 500, {
            error: "books_admin_failed",
            message: error.message
        });
    }
};
