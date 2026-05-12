const fs = require("fs");
const path = require("path");
const http = require("http");
const { URL } = require("url");

const rootDir = __dirname;
const port = Number(process.env.PORT || 3000);
const siteOrigin = (process.env.SITE_ORIGIN || "https://radeandcopublishing.cloud").replace(/\/+$/, "");
const siteLogoUrl = "https://lh3.googleusercontent.com/d/1QUwYAgNVOBAig4l61FgyQReoZE3-z8o8=w1000";

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

function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function absoluteUrl(value) {
    const normalized = String(value || "").trim();
    if (!normalized) {
        return `${siteOrigin}/assets/social-preview.png`;
    }
    if (/^https?:\/\//i.test(normalized)) {
        return normalized;
    }
    return `${siteOrigin}${normalized.startsWith("/") ? normalized : `/${normalized}`}`;
}

function buildSocialMetaTags(meta) {
    if (!meta) {
        return "";
    }

    const title = escapeHtml(meta.title || "Rade & Co Publishing");
    const description = escapeHtml(meta.description || "Elegant planners, meaningful journals, family-friendly books, and specialty titles designed with warmth and clarity.");
    const url = escapeHtml(meta.url || `${siteOrigin}/`);
    const image = escapeHtml(absoluteUrl(meta.image));
    const imageAlt = escapeHtml(meta.imageAlt || meta.title || "Rade & Co Publishing");
    const type = escapeHtml(meta.type || "website");

    return `
    <link rel="canonical" href="${url}">
    <meta property="og:type" content="${type}">
    <meta property="og:site_name" content="Rade &amp; Co Publishing">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:url" content="${url}">
    <meta property="og:image" content="${image}">
    <meta property="og:image:alt" content="${imageAlt}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${image}">`;
}

function buildJsonLdTags(structuredData) {
    if (!structuredData) {
        return "";
    }

    const entries = Array.isArray(structuredData) ? structuredData : [structuredData];

    return entries
        .filter(Boolean)
        .map((entry) => JSON.stringify(entry).replace(/</g, "\\u003c"))
        .map((entry) => `<script type="application/ld+json">${entry}</script>`)
        .join("\n");
}

function injectSocialMeta(html, meta) {
    if ((!meta || (!buildSocialMetaTags(meta) && !buildJsonLdTags(meta && meta.structuredData))) || !html.includes("</head>")) {
        return html;
    }

    const fragments = [buildSocialMetaTags(meta), buildJsonLdTags(meta.structuredData)].filter(Boolean).join("\n");
    return html.replace("</head>", `${fragments}\n</head>`);
}

function xmlEscape(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function buildRobotsTxt() {
    return [
        "User-agent: *",
        "Allow: /",
        "Disallow: /admin/",
        "Disallow: /api/",
        `Sitemap: ${siteOrigin}/sitemap.xml`
    ].join("\n");
}

async function buildSitemapXml() {
    const urls = [
        `${siteOrigin}/`,
        `${siteOrigin}/about.html`,
        `${siteOrigin}/books.html`,
        `${siteOrigin}/blog.html`,
        `${siteOrigin}/kids-corner.html`,
        `${siteOrigin}/contact-rights.html`
    ];

    try {
        const { getConfig, fetchAllRecords, mapBlogPostRecord, mapBookRecord } = require("./api/cms/_airtable");
        const config = getConfig();
        const [bookRecords, postRecords] = await Promise.all([
            fetchAllRecords(config.booksTable),
            fetchAllRecords(config.blogPostsTable)
        ]);

        const books = bookRecords.map(mapBookRecord).filter((book) => book.slug);
        const posts = postRecords.map(mapBlogPostRecord).filter((post) => post.slug);

        books.forEach((book) => {
            urls.push(`${siteOrigin}/books/${encodeURIComponent(book.slug)}.html`);
        });

        posts.forEach((post) => {
            urls.push(`${siteOrigin}/blog-post-template.html?slug=${encodeURIComponent(post.slug)}`);
        });
    } catch (error) {
        // Fall back to core pages only when Airtable is unavailable.
    }

    const uniqueUrls = [...new Set(urls)];
    const now = new Date().toISOString();

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniqueUrls.map((url) => `  <url>
    <loc>${xmlEscape(url)}</loc>
    <lastmod>${now}</lastmod>
  </url>`).join("\n")}
</urlset>`;
}

async function getDynamicSocialMeta(pathname, urlObject) {
    try {
        const { getConfig, fetchAllRecords, mapBlogPostRecord, mapBookRecord } = require("./api/cms/_airtable");
        const config = getConfig();

        if (pathname === "/blog-post-template.html") {
            const slug = urlObject.searchParams.get("slug");
            if (!slug) {
                return null;
            }

            const records = await fetchAllRecords(config.blogPostsTable);
            const posts = records.map(mapBlogPostRecord);
            const post = posts.find((entry) => entry.slug === slug);
            if (!post) {
                return null;
            }

            return {
                type: "article",
                title: post.title,
                description: post.excerpt || post.intro || "Read this featured article from Rade & Co Publishing.",
                url: `${siteOrigin}/blog-post-template.html?slug=${encodeURIComponent(post.slug)}`,
                image: post.featuredImage || post.image || "/assets/social-preview.png",
                imageAlt: `${post.title} featured image`,
                structuredData: buildArticleStructuredData(post)
            };
        }

        if (/^\/books\/[^/]+\.html$/i.test(pathname) && !/\/books\/_template\.html$/i.test(pathname)) {
            const slug = decodeURIComponent(pathname.split("/").pop().replace(/\.html$/i, ""));
            const records = await fetchAllRecords(config.booksTable);
            const books = records.map(mapBookRecord);
            const book = books.find((entry) => entry.slug === slug);
            if (!book) {
                return null;
            }

            return {
                type: "book",
                title: book.title,
                description: book.shortDescription || book.longDescription || "Book details from Rade & Co Publishing.",
                url: `${siteOrigin}${pathname}`,
                image: book.coverImage || "/assets/social-preview.png",
                imageAlt: `${book.title} cover`,
                structuredData: buildBookStructuredData(book, pathname)
            };
        }
    } catch (error) {
        return null;
    }

    return null;
}

function parsePageCount(value) {
    const match = String(value || "").match(/\d+/);
    return match ? Number(match[0]) : null;
}

function parseIsoDate(value) {
    if (!value) {
        return "";
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
}

function buildBookStructuredData(book, pathname) {
    if (!book || !book.title) {
        return null;
    }

    const imageSet = [
        book.coverImage,
        ...(Array.isArray(book.galleryImages) ? book.galleryImages : [])
    ]
        .map((image) => absoluteUrl(image))
        .filter(Boolean)
        .filter((image, index, list) => list.indexOf(image) === index);

    const pageCount = parsePageCount(book.specs && book.specs.pageCount);
    const hasRating = typeof book.rating === "number" && !Number.isNaN(book.rating);
    const hasReviewCount = typeof book.reviewCount === "number" && book.reviewCount > 0;

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "Book",
        "@id": `${siteOrigin}${pathname}#book`,
        name: book.title,
        url: `${siteOrigin}${pathname}`,
        image: imageSet.length === 1 ? imageSet[0] : imageSet,
        description: book.shortDescription || book.longDescription || "Book details from Rade & Co Publishing.",
        inLanguage: "en",
        genre: book.category || undefined,
        bookFormat: "https://schema.org/Paperback",
        author: {
            "@type": "Person",
            name: book.author || "Kate Rade"
        },
        publisher: {
            "@type": "Organization",
            name: "Rade & Co Publishing",
            url: `${siteOrigin}/`,
            logo: {
                "@type": "ImageObject",
                url: siteLogoUrl
            }
        },
        numberOfPages: pageCount || undefined,
        offers: book.amazonUrl
            ? {
                "@type": "Offer",
                url: book.amazonUrl,
                availability: "https://schema.org/InStock",
                seller: {
                    "@type": "Organization",
                    name: "Amazon"
                }
            }
            : undefined,
        aggregateRating: hasRating && hasReviewCount
            ? {
                "@type": "AggregateRating",
                ratingValue: book.rating,
                reviewCount: book.reviewCount
            }
            : undefined
    };

    return structuredData;
}

function buildArticleStructuredData(post) {
    if (!post || !post.title || !post.slug) {
        return null;
    }

    const articleUrl = `${siteOrigin}/blog-post-template.html?slug=${encodeURIComponent(post.slug)}`;
    const publishDate = parseIsoDate(post.publishDate || post.date);
    const imageUrl = absoluteUrl(post.featuredImage || post.image || "/assets/social-preview.png");

    return {
        "@context": "https://schema.org",
        "@type": "Article",
        "@id": `${articleUrl}#article`,
        mainEntityOfPage: articleUrl,
        headline: post.title,
        description: post.excerpt || post.intro || "Read this featured article from Rade & Co Publishing.",
        image: [imageUrl],
        datePublished: publishDate || undefined,
        dateModified: publishDate || undefined,
        author: {
            "@type": "Person",
            name: post.author || "Kate Rade"
        },
        publisher: {
            "@type": "Organization",
            name: "Rade & Co Publishing",
            url: `${siteOrigin}/`,
            logo: {
                "@type": "ImageObject",
                url: siteLogoUrl
            }
        },
        articleSection: post.category || undefined,
        inLanguage: "en",
        url: articleUrl
    };
}

async function serveFile(res, filePath, statusCode = 200, meta = null) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || "application/octet-stream";
    try {
        let data = await fs.promises.readFile(filePath);
        res.statusCode = statusCode;
        res.setHeader("Content-Type", contentType);
        if (/\.html$/i.test(filePath) && meta) {
            data = Buffer.from(injectSocialMeta(data.toString("utf8"), meta), "utf8");
        } else if (!/\.html$/i.test(filePath)) {
            res.setHeader("Cache-Control", "public, max-age=3600");
        }
        res.end(data);
    } catch (error) {
        res.statusCode = error.code === "ENOENT" ? 404 : 500;
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.end(error.code === "ENOENT" ? "Not found" : "Server error");
    }
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

async function handleSpecialRoute(res, pathname) {
    if (pathname === "/robots.txt") {
        res.statusCode = 200;
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.end(buildRobotsTxt());
        return true;
    }

    if (pathname === "/sitemap.xml") {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/xml; charset=utf-8");
        res.end(await buildSitemapXml());
        return true;
    }

    return false;
}

const server = http.createServer(async (req, res) => {
    const urlObject = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const pathname = urlObject.pathname;

    if (pathname.startsWith("/api/")) {
        await handleApi(req, res, pathname, urlObject);
        return;
    }

    if (await handleSpecialRoute(res, pathname)) {
        return;
    }

    const staticPath = resolveStaticPath(pathname);
    if (staticPath) {
        const meta = await getDynamicSocialMeta(pathname, urlObject);
        await serveFile(res, staticPath, 200, meta);
        return;
    }

    const fallbackPath = resolveStaticPath("/401.html");
    if (fallbackPath) {
        await serveFile(res, fallbackPath, 404);
        return;
    }

    res.statusCode = 404;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Not found");
});

server.listen(port, () => {
    console.log(`Rade & Co Publishing site running on port ${port}`);
});
