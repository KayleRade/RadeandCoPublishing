const fs = require("fs");
const path = require("path");
const { ensureAuthenticated } = require("./_auth");
const { parseBody } = require("./_request");

const uploadDir = path.join(__dirname, "..", "..", "uploads", "books");
const allowedMimeTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp"
]);
const maxFileSizeBytes = 2 * 1024 * 1024;

function sanitizeFilename(value) {
    return String(value || "image")
        .toLowerCase()
        .replace(/[^a-z0-9._-]+/g, "-")
        .replace(/^-+|-+$/g, "") || "image";
}

function extensionFor(contentType, filename) {
    const ext = path.extname(filename || "").toLowerCase();
    if (ext) {
        return ext;
    }
    switch (contentType) {
    case "image/jpeg":
        return ".jpg";
    case "image/png":
        return ".png";
    case "image/webp":
        return ".webp";
    case "image/gif":
        return ".gif";
    default:
        return ".bin";
    }
}

function getOrigin(req) {
    const protocol = req.headers["x-forwarded-proto"] || (req.socket && req.socket.encrypted ? "https" : "http");
    return `${protocol}://${req.headers.host}`;
}

module.exports = async (req, res) => {
    try {
        await ensureAuthenticated(req);

        if (req.method !== "POST") {
            res.status(405).setHeader("Content-Type", "application/json; charset=utf-8").send(JSON.stringify({
                error: "method_not_allowed",
                message: "Method not allowed."
            }));
            return;
        }

        const payload = await parseBody(req);
        const files = Array.isArray(payload.files) ? payload.files : [];
        if (!files.length) {
            res.status(400).setHeader("Content-Type", "application/json; charset=utf-8").send(JSON.stringify({
                error: "missing_files",
                message: "No image files were provided."
            }));
            return;
        }

        fs.mkdirSync(uploadDir, { recursive: true });

        const savedFiles = files.slice(0, 5).map((file, index) => {
            const contentType = String(file.contentType || "");
            if (!allowedMimeTypes.has(contentType)) {
                throw new Error(`Unsupported image type: ${contentType || "unknown"}. Please use JPG, PNG, or WEBP.`);
            }

            const dataUrl = String(file.dataUrl || "");
            const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
            if (!match || !match[2]) {
                throw new Error("Invalid image upload payload.");
            }

            const buffer = Buffer.from(match[2], "base64");
            if (buffer.length > maxFileSizeBytes) {
                throw new Error("Each image must be smaller than 2 MB.");
            }

            const timestamp = Date.now();
            const ext = extensionFor(contentType, file.filename);
            const safeName = sanitizeFilename(path.basename(file.filename || `image-${index + 1}`, path.extname(file.filename || "")));
            const storedFilename = `${timestamp}-${index + 1}-${safeName}${ext}`;
            const storedPath = path.join(uploadDir, storedFilename);

            fs.writeFileSync(storedPath, buffer);

            return {
                filename: storedFilename,
                url: `${getOrigin(req)}/uploads/books/${storedFilename}`
            };
        });

        res.status(200).setHeader("Content-Type", "application/json; charset=utf-8").send(JSON.stringify({
            files: savedFiles
        }));
    } catch (error) {
        res.status(error.statusCode || 500).setHeader("Content-Type", "application/json; charset=utf-8").send(JSON.stringify({
            error: "upload_failed",
            message: error.message || "Upload failed."
        }));
    }
};
