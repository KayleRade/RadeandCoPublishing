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

function setIfPresent(fields, key, value) {
    if (value === undefined || value === null) {
        return;
    }

    const normalized = typeof value === "string" ? value.trim() : value;
    if (normalized === "") {
        return;
    }

    fields[key] = normalized;
}

function toPostFields(payload) {
    const slug = slugify(payload.slug || payload.title);
    const fields = {
        Title: payload.title || "",
        Category: payload.category || "",
        Excerpt: payload.excerpt || "",
        "Body Content": payload.bodyContent || "",
        Slug: slug,
        Featured: Boolean(payload.featured),
    };

    setIfPresent(fields, "Author", payload.author || "Kate Rade");
    setIfPresent(fields, "Publish Date", payload.publishDate);
    setIfPresent(fields, "Reading Time", payload.readingTime);
    setIfPresent(fields, "Intro", payload.intro);
    setIfPresent(fields, "CTA Heading", payload.ctaHeading);
    setIfPresent(fields, "CTA Copy", payload.ctaCopy);

    return fields;
}

async function createOrUpdatePost(config, payload) {
    const fields = toPostFields(payload);

    if (payload.id) {
        return updateRecord(config.blogPostsTable, payload.id, fields);
    }

    return createRecord(config.blogPostsTable, fields);
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
            const record = await createOrUpdatePost(config, payload);
            sendJson(res, 200, mapBlogPostRecord(record));
            return;
        }

        if (req.method === "PUT") {
            const payload = await parseBody(req);
            if (!payload.id) {
                sendJson(res, 400, { error: "missing_id" });
                return;
            }
            const record = await createOrUpdatePost(config, payload);
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
