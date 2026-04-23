const fs = require("fs");
const path = require("path");
const http = require("http");
const { URL } = require("url");

const rootDir = __dirname;
const port = Number(process.env.PORT || 3000);

const mimeTypes = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".pdf": "application/pdf",
    ".ico": "image/x-icon",
    ".webp": "image/webp"
};

function createResponse(res) {
    let statusCode = 200;

    return {
        status(code) {
            statusCode = code;
            return this;
        },
        setHeader(name, value) {
            res.setHeader(name, value);
            return this;
        },
        send(body) {
            res.statusCode = statusCode;
            res.end(body);
            return this;
        }
    };
}

function serveFile(res, filePath, statusCode = 200) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || "application/octet-stream";
    fs.readFile(filePath, (error, data) => {
        if (error) {
            res.statusCode = error.code === "ENOENT" ? 404 : 500;
            res.setHeader("Content-Type", "text/plain; charset=utf-8");
            res.end(error.code === "ENOENT" ? "Not found" : "Server error");
            return;
        }

        res.statusCode = statusCode;
        res.setHeader("Content-Type", contentType);
        if (!/\.html$/i.test(filePath)) {
            res.setHeader("Cache-Control", "public, max-age=3600");
        }
        res.end(data);
    });
}

function resolveStaticPath(urlPath) {
    const cleaned = decodeURIComponent(urlPath.split("?")[0]);
    let relativePath = cleaned === "/" ? "/index.html" : cleaned;

    if (relativePath.endsWith("/")) {
        relativePath += "index.html";
    }

    if (/^\/books\/[^/]+\.html$/i.test(relativePath) && !/\/books\/_template\.html$/i.test(relativePath)) {
        const dynamicBookTemplate = path.join(rootDir, "books", "_template.html");
        if (fs.existsSync(dynamicBookTemplate)) {
            return dynamicBookTemplate;
        }
    }

    const fullPath = path.normalize(path.join(rootDir, relativePath));
    if (!fullPath.startsWith(rootDir)) {
        return null;
    }

    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
        return fullPath;
    }

    return null;
}

function resolveApiModule(urlPath) {
    const filePath = path.normalize(path.join(rootDir, `${urlPath}.js`));
    if (!filePath.startsWith(path.join(rootDir, "api"))) {
        return null;
    }
    if (!fs.existsSync(filePath)) {
        return null;
    }
    return filePath;
}

async function handleApi(req, res, pathname, urlObject) {
    const modulePath = resolveApiModule(pathname);
    if (!modulePath) {
        const notFoundPath = resolveStaticPath("/401.html");
        if (notFoundPath) {
            serveFile(res, notFoundPath, 404);
            return;
        }
        res.statusCode = 404;
        res.end("Not found");
        return;
    }

    delete require.cache[require.resolve(modulePath)];
    const handler = require(modulePath);
    req.query = Object.fromEntries(urlObject.searchParams.entries());
    req.path = pathname;
    req.url = urlObject.pathname + urlObject.search;
    req.body = undefined;

    const wrappedRes = createResponse(res);
    try {
        await handler(req, wrappedRes);
        if (!res.writableEnded) {
            res.end();
        }
    } catch (error) {
        console.error(`API error for ${pathname}:`, error);
        if (!res.writableEnded) {
            wrappedRes
                .status(error.statusCode || 500)
                .setHeader("Content-Type", "application/json; charset=utf-8")
                .send(JSON.stringify({
                    error: "server_error",
                    message: error.message || "Unexpected server error."
                }));
        }
    }
}

const server = http.createServer(async (req, res) => {
    const urlObject = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const pathname = urlObject.pathname;

    if (pathname.startsWith("/api/")) {
        await handleApi(req, res, pathname, urlObject);
        return;
    }

    const staticPath = resolveStaticPath(pathname);
    if (staticPath) {
        serveFile(res, staticPath, 200);
        return;
    }

    const fallbackPath = resolveStaticPath("/401.html");
    if (fallbackPath) {
        serveFile(res, fallbackPath, 404);
        return;
    }

    res.statusCode = 404;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Not found");
});

server.listen(port, () => {
    console.log(`Rade & Co Publishing site running on port ${port}`);
});
