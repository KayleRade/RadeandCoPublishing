const {
    getConfig,
    fetchAllRecords,
    createRecord,
    updateRecord,
    deleteRecord,
    mapBlogPostRecord,
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

function toPostFields(payload) {
    const slug = slugify(payload.slug || payload.title);
    return {
        Title: payload.title || "",
        Category: payload.category || "",
        "Featured Image URL": payload.featuredImage || "",
        Excerpt: payload.excerpt || "",
        "Body Content": payload.bodyContent || "",
        Author: payload.author || "Kate Rade",
        "Publish Date": payload.publishDate || "",
        "Reading Time": payload.readingTime || "",
        Slug: slug,
        "Related Book": payload.relatedBook || "",
        Featured: Boolean(payload.featured),
        Intro: payload.intro || "",
        "CTA Heading": payload.ctaHeading || "",
        "CTA Copy": payload.ctaCopy || ""
    };
}

module.exports = async (req, res) => {
    try {
        await ensureAuthenticated(req);
        const config = getConfig();

        if (req.method === "GET") {
            const records = await fetchAllRecords(config.blogPostsTable);
            sendJson(res, 200, records.map(mapBlogPostRecord));
            return;
        }

        if (req.method === "POST") {
            const payload = await parseBody(req);
            const record = await createRecord(config.blogPostsTable, toPostFields(payload));
            sendJson(res, 200, mapBlogPostRecord(record));
            return;
        }

        if (req.method === "PUT") {
            const payload = await parseBody(req);
            if (!payload.id) {
                sendJson(res, 400, { error: "missing_id" });
                return;
            }
            const record = await updateRecord(config.blogPostsTable, payload.id, toPostFields(payload));
            sendJson(res, 200, mapBlogPostRecord(record));
            return;
        }

        if (req.method === "DELETE") {
            const payload = await parseBody(req);
            if (!payload.id) {
                sendJson(res, 400, { error: "missing_id" });
                return;
            }
            await deleteRecord(config.blogPostsTable, payload.id);
            sendJson(res, 200, { deleted: true });
            return;
        }

        sendJson(res, 405, { error: "method_not_allowed" });
    } catch (error) {
        sendJson(res, error.statusCode || 500, {
            error: "posts_admin_failed",
            message: error.message
        });
    }
};
