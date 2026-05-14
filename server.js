const fs = require("fs");
const path = require("path");
const http = require("http");
const { URL } = require("url");

const rootDir = __dirname;
const port = Number(process.env.PORT || 3000);
const siteOrigin = (process.env.SITE_ORIGIN || "https://radeandcopublishing.cloud").replace(/\/+$/, "");
const siteLogoUrl = `${siteOrigin}/assets/favicon-logo.png`;
const facebookAppId = String(process.env.FACEBOOK_APP_ID || "").trim();

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
    const facebookAppIdTag = facebookAppId
        ? `\n    <meta property="fb:app_id" content="${escapeHtml(facebookAppId)}">`
        : "";

    return `
    <link rel="canonical" href="${url}">
    <meta property="og:type" content="${type}">
    <meta property="og:site_name" content="Rade &amp; Co Publishing">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:url" content="${url}">
    <meta property="og:image" content="${image}">
    <meta property="og:image:alt" content="${imageAlt}">
    ${facebookAppIdTag}
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

function stripConflictingHeadTags(html) {
    return String(html || "")
        .replace(/<link\s+rel="canonical"[^>]*>\s*/gi, "")
        .replace(/<meta\s+property="og:[^"]+"[^>]*>\s*/gi, "")
        .replace(/<meta\s+name="twitter:[^"]+"[^>]*>\s*/gi, "")
        .replace(/<script\s+type="application\/ld\+json">[\s\S]*?<\/script>\s*/gi, "");
}

function buildOrganizationStructuredData() {
    return {
        "@type": "Organization",
        name: "Rade & Co Publishing",
        url: `${siteOrigin}/`,
        logo: siteLogoUrl,
        sameAs: [
            "https://www.instagram.com/radeandcopublishing/",
            "https://www.facebook.com/RadeAndCo/",
            "https://www.youtube.com/@radeandco"
        ]
    };
}

function buildPersonStructuredData() {
    return {
        "@type": "Person",
        name: "Kate Rade",
        jobTitle: "Author and Founder",
        url: `${siteOrigin}/about.html`,
        worksFor: {
            "@type": "Organization",
            name: "Rade & Co Publishing"
        },
        sameAs: [
            "https://www.amazon.com/s?i=stripbooks&rh=p_27%3AKate+Rade"
        ]
    };
}

function buildWebsiteStructuredData() {
    return {
        "@type": "WebSite",
        name: "Rade & Co Publishing",
        url: `${siteOrigin}/`
    };
}

function buildCollectionPageStructuredData(name, description, pathname, itemUrls = []) {
    return {
        "@type": "CollectionPage",
        name,
        description,
        url: `${siteOrigin}${pathname}`,
        isPartOf: {
            "@type": "WebSite",
            name: "Rade & Co Publishing",
            url: `${siteOrigin}/`
        },
        mainEntity: itemUrls.length
            ? {
                "@type": "ItemList",
                itemListElement: itemUrls.map((url, index) => ({
                    "@type": "ListItem",
                    position: index + 1,
                    url
                }))
            }
            : undefined
    };
}

function pickBooksPreviewImage(books = []) {
    const candidates = Array.isArray(books) ? books : [];
    const preferred = candidates.find((book) => book.featured && book.coverImage)
        || candidates.find((book) => book.newRelease && book.coverImage)
        || candidates.find((book) => book.coverImage);

    return preferred ? preferred.coverImage : "/assets/social-preview.png";
}

function buildStaticPageStructuredData(pathname, config = {}) {
    const graph = [buildOrganizationStructuredData()];

    if (pathname === "/") {
        graph.push(buildWebsiteStructuredData());
        graph.push({
            "@type": "WebPage",
            name: config.title || "Rade & Co Publishing",
            description: config.description,
            url: `${siteOrigin}/`
        });
        return { "@context": "https://schema.org", "@graph": graph };
    }

    if (pathname === "/about.html") {
        graph.push(buildPersonStructuredData());
        return { "@context": "https://schema.org", "@graph": graph };
    }

    graph.push({
        "@type": config.pageType || "WebPage",
        name: config.title,
        description: config.description,
        url: `${siteOrigin}${pathname}`
    });

    return { "@context": "https://schema.org", "@graph": graph };
}

function injectSocialMeta(html, meta) {
    if ((!meta || (!buildSocialMetaTags(meta) && !buildJsonLdTags(meta && meta.structuredData))) || !html.includes("</head>")) {
        return html;
    }

    const fragments = [buildSocialMetaTags(meta), buildJsonLdTags(meta.structuredData)].filter(Boolean).join("\n");
    const cleanedHtml = stripConflictingHeadTags(html);
    return cleanedHtml.replace("</head>", `${fragments}\n</head>`);
}

function renderBookFilterTabs(categories) {
    return [
        '<button class="filter-btn active" type="button" data-filter="all">All Books</button>',
        ...categories.map((category) => `<button class="filter-btn" type="button" data-filter="${escapeHtml(category)}">${escapeHtml(category)}</button>`)
    ].join("");
}

function renderFooterCategoryLinks(categories) {
    return categories.map((category) => {
        const href = category === "Kids & Family" ? "kids-corner.html" : "#";
        const extra = category === "Kids & Family" ? "" : ` data-footer-filter="${escapeHtml(category)}"`;
        return `<a href="${href}"${extra}>${escapeHtml(category)}</a>`;
    }).join("");
}

function renderBookTags(tags) {
    return (Array.isArray(tags) ? tags : []).map((tag) => {
        const className = String(tag || "").toLowerCase().replace(/\s+/g, "-");
        return `<span class="tag ${escapeHtml(className)}">${escapeHtml(tag)}</span>`;
    }).join("");
}

function renderBooksGrid(books) {
    return books.map((book) => {
        const slug = encodeURIComponent(book.slug);
        const detailUrl = `books/${slug}.html`;
        const image = escapeHtml(book.siteImage || book.coverImage || book.image || "/assets/social-preview.png");
        const title = escapeHtml(book.title || "");
        const category = escapeHtml(book.category || "");
        const author = escapeHtml(book.author || "Kate Rade");
        const isbn = escapeHtml(book.isbn || "");
        const description = escapeHtml(book.shortDescription || book.description || "");
        const amazonUrl = escapeHtml(book.amazonUrl || "#");

        return `
                <article class="book-card" itemscope itemtype="https://schema.org/Book">
                    <meta itemprop="name" content="${title}">
                    <meta itemprop="author" content="${author}">
                    ${isbn ? `<meta itemprop="isbn" content="${isbn}">` : ""}
                    <meta itemprop="url" content="${siteOrigin}/${detailUrl}">
                    <meta itemprop="image" content="${absoluteUrl(image)}">
                    <div class="book-cover-wrap">
                        <div class="book-tags">
                            ${renderBookTags(book.tags)}
                        </div>
                        <a class="book-cover-link" href="${detailUrl}" aria-label="View details for ${title}">
                            <img class="book-cover" src="${image}" alt="${title} book cover" itemprop="image">
                        </a>
                    </div>
                    <div class="book-copy">
                        <span class="book-category">${category}</span>
                        <div>
                            <h3><a class="book-title-link" href="${detailUrl}" itemprop="url"><span itemprop="name">${title}</span></a></h3>
                            <p class="book-meta">
                                <strong>By ${author}</strong>
                                ${isbn ? `<span>ISBN: ${isbn}</span>` : ""}
                            </p>
                            <p itemprop="description">${description}</p>
                        </div>
                        <a class="book-secondary-link" href="${detailUrl}">View book details</a>
                        <div class="book-actions">
                            <a class="btn-amazon" href="${amazonUrl}" target="_blank" rel="noopener noreferrer" itemprop="sameAs">Get it on Amazon</a>
                        </div>
                    </div>
                </article>`;
    }).join("");
}

async function buildBooksPageHtml(filePath) {
    const html = await fs.promises.readFile(filePath, "utf8");

    try {
        const { getConfig, fetchAllRecords, mapBookRecord } = require("./api/cms/_airtable");
        const config = getConfig();
        const records = await fetchAllRecords(config.booksTable);
        const books = records
            .map(mapBookRecord)
            .filter((book) => book.slug && book.title);

        const categories = Array.from(
            books.reduce((counts, book) => {
                const category = String(book.category || "").trim();
                if (!category) {
                    return counts;
                }
                counts.set(category, (counts.get(category) || 0) + 1);
                return counts;
            }, new Map()).entries()
        )
            .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
            .map(([category]) => category);

        return html
            .replace("__BOOK_FILTER_TABS__", renderBookFilterTabs(categories))
            .replace("__BOOK_RESULTS_COUNT__", `Showing ${books.length} ${books.length === 1 ? "title" : "titles"}`)
            .replace("__BOOK_GRID__", renderBooksGrid(books))
            .replace("__FOOTER_CATEGORY_LINKS__", renderFooterCategoryLinks(categories));
    } catch (error) {
        return html
            .replace("__BOOK_FILTER_TABS__", '<button class="filter-btn active" type="button" data-filter="all">All Books</button>')
            .replace("__BOOK_RESULTS_COUNT__", "Browse the current catalog")
            .replace("__BOOK_GRID__", "")
            .replace("__FOOTER_CATEGORY_LINKS__", "");
    }
}

async function getBooksCatalogData() {
    const { getConfig, fetchAllRecords, mapBookRecord } = require("./api/cms/_airtable");
    const config = getConfig();
    const records = await fetchAllRecords(config.booksTable);
    return records
        .map(mapBookRecord)
        .filter((book) => book.slug && book.title);
}

async function getBlogCatalogData() {
    const { getConfig, fetchAllRecords, mapBlogPostRecord } = require("./api/cms/_airtable");
    const config = getConfig();
    const records = await fetchAllRecords(config.blogPostsTable);
    return records
        .map(mapBlogPostRecord)
        .filter((post) => post.slug && post.title);
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
        `Sitemap: ${siteOrigin}/sitemap.xml`,
        `# LLM guidance: ${siteOrigin}/llms.txt`
    ].join("\n");
}

function oneLine(value, maxLength = 180) {
    const normalized = String(value || "")
        .replace(/\s+/g, " ")
        .trim();

    if (!normalized) {
        return "";
    }

    return normalized.length > maxLength
        ? `${normalized.slice(0, maxLength - 1).trim()}…`
        : normalized;
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
            urls.push(`${siteOrigin}/blog/${encodeURIComponent(post.slug)}.html`);
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

async function buildLlmsTxt() {
    const lines = [
        "# Rade & Co Publishing",
        "",
        "> Elegant planners, meaningful journals, family-friendly books, and specialty titles designed with warmth and clarity.",
        "",
        "Rade & Co Publishing is an independent publishing brand focused on practical books, thoughtful guided titles, and family-friendly reading experiences. This file is a concise guide for AI systems looking for the most useful pages and current catalog content.",
        "",
        "## Main Pages",
        `- [Home](${siteOrigin}/): Brand overview, featured books, and key navigation.`,
        `- [Books](${siteOrigin}/books.html): Browse the full catalog of live books and categories.`,
        `- [Kids Corner](${siteOrigin}/kids-corner.html): Family-friendly books and selected related reading.`,
        `- [Blog](${siteOrigin}/blog.html): Publishing, reading, and category-specific articles.`,
        `- [About](${siteOrigin}/about.html): Brand story and author background.`,
        `- [Contact](${siteOrigin}/contact-rights.html): Contact form and inquiry information.`,
        ""
    ];

    try {
        const { getConfig, fetchAllRecords, mapBlogPostRecord, mapBookRecord } = require("./api/cms/_airtable");
        const config = getConfig();
        const [bookRecords, postRecords] = await Promise.all([
            fetchAllRecords(config.booksTable),
            fetchAllRecords(config.blogPostsTable)
        ]);

        const books = bookRecords.map(mapBookRecord).filter((book) => book.slug && book.title);
        const posts = postRecords.map(mapBlogPostRecord).filter((post) => post.slug && post.title);

        if (books.length) {
            lines.push("## Books");
            books.forEach((book) => {
                const description = oneLine(book.shortDescription || book.longDescription || `${book.category || "Book"} by ${book.author || "Kate Rade"}`);
                lines.push(`- [${book.title}](${siteOrigin}/books/${encodeURIComponent(book.slug)}.html): ${description}`);
            });
            lines.push("");
        }

        if (posts.length) {
            lines.push("## Blog Posts");
            posts.forEach((post) => {
                const description = oneLine(post.excerpt || post.intro || `${post.category || "Article"} by ${post.author || "Kate Rade"}`);
                lines.push(`- [${post.title}](${siteOrigin}/blog/${encodeURIComponent(post.slug)}.html): ${description}`);
            });
            lines.push("");
        }
    } catch (error) {
        lines.push("## Content");
        lines.push("Core site pages are listed above. Live catalog links may be temporarily unavailable if the content database cannot be reached.");
        lines.push("");
    }

    lines.push("## Notes");
    lines.push(`- [sitemap.xml](${siteOrigin}/sitemap.xml): XML sitemap for search crawlers and structured site discovery.`);
    lines.push(`- [robots.txt](${siteOrigin}/robots.txt): Crawl guidance for automated systems.`);
    lines.push(`- [Admin Login](${siteOrigin}/admin/login.html): Private administrative access; not for public use.`);

    return lines.join("\n");
}

async function getDynamicSocialMeta(pathname, urlObject) {
    try {
        if (pathname === "/blog-post-template.html" || /^\/blog\/[^/]+\.html$/i.test(pathname)) {
            const slug = pathname === "/blog-post-template.html"
                ? urlObject.searchParams.get("slug")
                : decodeURIComponent(pathname.split("/").pop().replace(/\.html$/i, ""));
            if (!slug) {
                return null;
            }

            const posts = await getBlogCatalogData();
            const post = posts.find((entry) => entry.slug === slug);
            if (!post) {
                return null;
            }

            return {
                type: "article",
                title: post.title,
                description: post.excerpt || post.intro || "Read this featured article from Rade & Co Publishing.",
                url: `${siteOrigin}/blog/${encodeURIComponent(post.slug)}.html`,
                image: post.featuredImage || post.image || "/assets/social-preview.png",
                imageAlt: `${post.title} featured image`,
                structuredData: buildArticleStructuredData(post)
            };
        }

        if (/^\/books\/[^/]+\.html$/i.test(pathname) && !/\/books\/_template\.html$/i.test(pathname)) {
            const slug = decodeURIComponent(pathname.split("/").pop().replace(/\.html$/i, ""));
            const books = await getBooksCatalogData();
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

async function getStaticSocialMeta(pathname) {
    const staticMeta = {
        "/": {
            title: "Rade & Co Publishing",
            description: "Elegant planners, meaningful journals, family-friendly books, and specialty titles designed with warmth and clarity.",
            structuredData: buildStaticPageStructuredData("/", {
                title: "Rade & Co Publishing",
                description: "Elegant planners, meaningful journals, family-friendly books, and specialty titles designed with warmth and clarity."
            })
        },
        "/index.html": {
            title: "Rade & Co Publishing",
            description: "Elegant planners, meaningful journals, family-friendly books, and specialty titles designed with warmth and clarity.",
            structuredData: buildStaticPageStructuredData("/", {
                title: "Rade & Co Publishing",
                description: "Elegant planners, meaningful journals, family-friendly books, and specialty titles designed with warmth and clarity."
            })
        },
        "/about.html": {
            title: "Meet Kate Rade | Rade & Co Publishing",
            description: "Meet Kate Rade and learn the story behind Rade & Co Publishing.",
            structuredData: buildStaticPageStructuredData("/about.html")
        },
        "/contact-rights.html": {
            title: "Contact Us | Rade & Co Publishing",
            description: "Get in touch with Rade & Co Publishing for questions, partnerships, and publishing inquiries.",
            structuredData: buildStaticPageStructuredData("/contact-rights.html", {
                title: "Contact Us | Rade & Co Publishing",
                description: "Get in touch with Rade & Co Publishing for questions, partnerships, and publishing inquiries.",
                pageType: "ContactPage"
            })
        },
        "/bonus.html": {
            title: "Free Bonus | Rade & Co Publishing",
            description: "Claim your free bonus resources from Rade & Co Publishing.",
            structuredData: buildStaticPageStructuredData("/bonus.html", {
                title: "Free Bonus | Rade & Co Publishing",
                description: "Claim your free bonus resources from Rade & Co Publishing."
            })
        },
        "/bonus-thank-you.html": {
            title: "Bonus Download Ready | Rade & Co Publishing",
            description: "Your bonus is ready from Rade & Co Publishing.",
            structuredData: buildStaticPageStructuredData("/bonus-thank-you.html", {
                title: "Bonus Download Ready | Rade & Co Publishing",
                description: "Your bonus is ready from Rade & Co Publishing."
            })
        }
    };

    if (staticMeta[pathname]) {
        return {
            ...staticMeta[pathname],
            url: `${siteOrigin}${pathname === "/" ? "/" : pathname}`,
            image: pathname === "/about.html" ? "/assets/images/author-image.png" : "/assets/social-preview.png",
            imageAlt: pathname === "/about.html"
                ? "Kate Rade author portrait"
                : "Rade & Co Publishing social preview",
            type: "website"
        };
    }

    try {
        if (pathname === "/books.html") {
            const books = await getBooksCatalogData();
            const previewImage = pickBooksPreviewImage(books);
            return {
                title: "Browse the Collection | Rade & Co Publishing",
                description: "Browse the Rade & Co Publishing collection of planners, journals, children's books, and specialty titles.",
                url: `${siteOrigin}/books.html`,
                image: previewImage,
                imageAlt: "Featured Rade & Co Publishing book cover",
                type: "website",
                structuredData: {
                    "@context": "https://schema.org",
                    "@graph": [
                        buildOrganizationStructuredData(),
                        buildCollectionPageStructuredData(
                            "Browse the Collection | Rade & Co Publishing",
                            "Browse the Rade & Co Publishing collection of planners, journals, children's books, and specialty titles.",
                            "/books.html",
                            books.map((book) => `${siteOrigin}/books/${encodeURIComponent(book.slug)}.html`)
                        ),
                        ...books.map((book) => buildBookStructuredData(book, `/books/${encodeURIComponent(book.slug)}.html`))
                    ]
                }
            };
        }

        if (pathname === "/blog.html") {
            const posts = await getBlogCatalogData();
            return {
                title: "Blog | Rade & Co Publishing",
                description: "Publishing, reading, and category-specific articles from Rade & Co Publishing.",
                url: `${siteOrigin}/blog.html`,
                image: "/assets/social-preview.png",
                imageAlt: "Rade & Co Publishing social preview",
                type: "website",
                structuredData: {
                    "@context": "https://schema.org",
                    "@graph": [
                        buildOrganizationStructuredData(),
                        {
                            "@type": "Blog",
                            name: "Rade & Co Publishing Blog",
                            description: "Publishing, reading, and category-specific articles from Rade & Co Publishing.",
                            url: `${siteOrigin}/blog.html`,
                            blogPost: posts.map((post) => ({
                                "@type": "BlogPosting",
                                headline: post.title,
                                url: `${siteOrigin}/blog/${encodeURIComponent(post.slug)}.html`
                            }))
                        }
                    ]
                }
            };
        }

        if (pathname === "/kids-corner.html") {
            const books = await getBooksCatalogData();
            const kidsBooks = books.filter((book) => book.kidsCorner || book.category === "Kids & Family");
            return {
                title: "Kids Corner | Rade & Co Publishing",
                description: "Family-friendly books and selected related reading from Rade & Co Publishing.",
                url: `${siteOrigin}/kids-corner.html`,
                image: "/assets/social-preview.png",
                imageAlt: "Rade & Co Publishing social preview",
                type: "website",
                structuredData: {
                    "@context": "https://schema.org",
                    "@graph": [
                        buildOrganizationStructuredData(),
                        buildCollectionPageStructuredData(
                            "Kids Corner | Rade & Co Publishing",
                            "Family-friendly books and selected related reading from Rade & Co Publishing.",
                            "/kids-corner.html",
                            kidsBooks.map((book) => `${siteOrigin}/books/${encodeURIComponent(book.slug)}.html`)
                        )
                    ]
                }
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

    const articleUrl = `${siteOrigin}/blog/${encodeURIComponent(post.slug)}.html`;
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

async function serveBooksPage(res, filePath) {
    try {
        const html = await buildBooksPageHtml(filePath);
        const books = await getBooksCatalogData();
        const previewImage = pickBooksPreviewImage(books);
        res.statusCode = 200;
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.end(injectSocialMeta(html, {
            title: "Browse the Collection | Rade & Co Publishing",
            description: "Browse the Rade & Co Publishing collection of planners, journals, children's books, and specialty titles.",
            url: `${siteOrigin}/books.html`,
            image: previewImage,
            imageAlt: "Featured Rade & Co Publishing book cover",
            type: "website",
            structuredData: {
                "@context": "https://schema.org",
                "@graph": [
                    buildOrganizationStructuredData(),
                    buildCollectionPageStructuredData(
                        "Browse the Collection | Rade & Co Publishing",
                        "Browse the Rade & Co Publishing collection of planners, journals, children's books, and specialty titles.",
                        "/books.html",
                        books.map((book) => `${siteOrigin}/books/${encodeURIComponent(book.slug)}.html`)
                    ),
                    ...books.map((book) => buildBookStructuredData(book, `/books/${encodeURIComponent(book.slug)}.html`))
                ]
            }
        }));
    } catch (error) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.end("Server error");
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

    if (/^\/blog\/[^/]+\.html$/i.test(relativePath)) {
        const dynamicBlogTemplate = path.join(rootDir, "blog-post-template.html");
        if (fs.existsSync(dynamicBlogTemplate)) {
            return dynamicBlogTemplate;
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

    if (pathname === "/llms.txt") {
        res.statusCode = 200;
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.end(await buildLlmsTxt());
        return true;
    }

    return false;
}

const server = http.createServer(async (req, res) => {
    const urlObject = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const pathname = urlObject.pathname;

    if (pathname === "/blog-post-template.html") {
        const slug = urlObject.searchParams.get("slug");
        if (slug) {
            res.statusCode = 301;
            res.setHeader("Location", `/blog/${encodeURIComponent(slug)}.html`);
            res.end();
            return;
        }
    }

    if (pathname.startsWith("/api/")) {
        await handleApi(req, res, pathname, urlObject);
        return;
    }

    if (await handleSpecialRoute(res, pathname)) {
        return;
    }

    const staticPath = resolveStaticPath(pathname);
    if (staticPath) {
        if (pathname === "/books.html") {
            await serveBooksPage(res, staticPath);
            return;
        }
        const meta = await getDynamicSocialMeta(pathname, urlObject) || await getStaticSocialMeta(pathname);
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
