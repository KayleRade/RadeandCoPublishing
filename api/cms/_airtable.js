const AIRTABLE_API_BASE = "https://api.airtable.com/v0";

function requireEnv(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

function getConfig() {
    return {
        token: requireEnv("AIRTABLE_PAT"),
        baseId: requireEnv("AIRTABLE_BASE_ID"),
        booksTable: process.env.AIRTABLE_BOOKS_TABLE || "Books",
        blogPostsTable: process.env.AIRTABLE_BLOG_POSTS_TABLE || "Blog Posts",
        adminUsersTable: process.env.AIRTABLE_ADMIN_USERS_TABLE || "Admin Users",
        homepageTable: process.env.AIRTABLE_HOMEPAGE_TABLE || "Homepage Content",
        announcementsTable: process.env.AIRTABLE_ANNOUNCEMENTS_TABLE || "Announcements",
        siteSettingsTable: process.env.AIRTABLE_SITE_SETTINGS_TABLE || "Site Settings",
        mediaLibraryTable: process.env.AIRTABLE_MEDIA_TABLE || "Media Library",
        subscribersTable: process.env.AIRTABLE_SUBSCRIBERS_TABLE || "Subscribers",
        contactFormTable: process.env.AIRTABLE_CONTACT_FORM_TABLE || "Contact Form"
    };
}

function buildUrl(tableName, recordId) {
    const { baseId } = getConfig();
    const encodedTable = encodeURIComponent(tableName);
    const encodedRecord = recordId ? `/${encodeURIComponent(recordId)}` : "";
    return `${AIRTABLE_API_BASE}/${baseId}/${encodedTable}${encodedRecord}`;
}

async function airtableRequest(url, options) {
    const { token } = getConfig();
    const response = await fetch(url, {
        ...options,
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
            ...(options && options.headers ? options.headers : {})
        }
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Airtable request failed: ${response.status} ${errorText}`);
    }

    if (response.status === 204) {
        return {};
    }

    return response.json();
}

async function fetchAllRecords(tableName, options) {
    const records = [];
    let offset = "";

    do {
        const url = new URL(buildUrl(tableName));
        url.searchParams.set("pageSize", "100");

        if (offset) {
            url.searchParams.set("offset", offset);
        }

        if (options && options.filterByFormula) {
            url.searchParams.set("filterByFormula", options.filterByFormula);
        }

        if (options && options.sort && Array.isArray(options.sort)) {
            options.sort.forEach((entry, index) => {
                url.searchParams.set(`sort[${index}][field]`, entry.field);
                url.searchParams.set(`sort[${index}][direction]`, entry.direction || "asc");
            });
        }

        const data = await airtableRequest(url.toString(), { method: "GET" });
        records.push(...(data.records || []));
        offset = data.offset || "";
    } while (offset);

    return records;
}

async function createRecord(tableName, fields) {
    const data = await airtableRequest(buildUrl(tableName), {
        method: "POST",
        body: JSON.stringify({
            fields,
            typecast: true
        })
    });
    return data;
}

async function updateRecord(tableName, recordId, fields) {
    const data = await airtableRequest(buildUrl(tableName, recordId), {
        method: "PATCH",
        body: JSON.stringify({
            fields,
            typecast: true
        })
    });
    return data;
}

async function deleteRecord(tableName, recordId) {
    await airtableRequest(buildUrl(tableName, recordId), {
        method: "DELETE"
    });
}

function assetUrl(fieldValue) {
    if (!fieldValue) {
        return "";
    }

    if (typeof fieldValue === "string") {
        return fieldValue;
    }

    if (Array.isArray(fieldValue) && fieldValue[0] && fieldValue[0].url) {
        return fieldValue[0].url;
    }

    return "";
}

function assetUrls(fieldValue) {
    if (!fieldValue) {
        return [];
    }

    if (typeof fieldValue === "string") {
        return splitList(fieldValue);
    }

    if (Array.isArray(fieldValue)) {
        return fieldValue
            .map((item) => (item && item.url ? item.url : ""))
            .filter(Boolean);
    }

    return [];
}

function truthy(value) {
    return value === true || value === "true" || value === 1 || value === "1";
}

function splitLines(value) {
    if (!value || typeof value !== "string") {
        return [];
    }

    return value
        .split(/\r?\n\r?\n/)
        .map((chunk) => chunk.trim())
        .filter(Boolean)
        .map((chunk, index) => ({
            heading: index === 0 ? "Overview" : `Section ${index + 1}`,
            paragraphs: chunk.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
        }));
}

function splitList(value) {
    if (!value || typeof value !== "string") {
        return [];
    }

    return value
        .split(/\r?\n|,/)
        .map((item) => item.trim())
        .filter(Boolean);
}

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

function mapBookRecord(record) {
    const fields = record.fields || {};
    const featured = truthy(fields["Featured"]);
    const newRelease = truthy(fields["New Release"]);
    const series = truthy(fields["Series"]);
    const rating = typeof fields["Rating"] === "number" ? fields["Rating"] : null;
    const reviewCount = typeof fields["Review Count"] === "number" ? fields["Review Count"] : null;
    const category = fields["Category"] || "";
    const slug = slugify(fields["Slug"] || fields["Title"] || "");
    const coverImages = assetUrls(fields["Cover Image"]);
    const galleryImages = [
        ...assetUrls(fields["Gallery Images"]),
        ...coverImages.slice(1)
    ].filter((item, index, list) => item && list.indexOf(item) === index);
    const primaryImage = coverImages[0] || fields["Cover Image URL"] || galleryImages[0] || "";

    const tags = [];
    if (featured) {
        tags.push("Bestseller");
    }
    if (newRelease) {
        tags.push("New Release");
    }
    if (series) {
        tags.push("Series");
    }

    return {
        id: record.id,
        title: fields["Title"] || "",
        category,
        amazonUrl: fields["Amazon URL"] || "",
        coverImage: primaryImage,
        shortDescription: fields["Short Description"] || "",
        longDescription: fields["Long Description"] || fields["Short Description"] || "",
        rating,
        reviewCount,
        featured,
        newRelease,
        series,
        kidsCorner: truthy(fields["Kids Corner Book"]),
        kidsCornerFeatured: truthy(fields["Kids Corner Featured"]),
        author: fields["Author"] || "Kate Rade",
        slug,
        tags,
        galleryImages,
        specs: {
            trimSize: fields["Trim Size"] || "",
            pageCount: fields["Page Count"] || "",
            paperType: fields["Paper Type"] || "",
            bindingType: fields["Binding Type"] || ""
        },
        videoUrl: fields["Book Video URL"] || "",
        freeBonusTitle: fields["Free Bonus Title"] || "Free Bonus",
        freeBonusFileUrl: fields["Free Bonus File URL"] || "",
        details: {
            audience: fields["Who This Book Is For"] || fields["Short Description"] || "",
            problem: fields["Problem It Solves"] || "",
            outcome: fields["Reader Outcome"] || ""
        },
        proof: {
            rating: rating || 0,
            reviewCount: reviewCount || 0,
            headline: fields["Review Headline"] || "",
            snippet: fields["Review Snippet"] || ""
        },
        benefits: [],
        siteImage: primaryImage,
        image: primaryImage,
        description: fields["Short Description"] || ""
    };
}

function mapBlogPostRecord(record) {
    const fields = record.fields || {};
    const relatedBookValue = fields["Related Book(s)"] || fields["Related Book"] || fields["Related Books"] || fields["Related book"];
    const relatedBook = Array.isArray(relatedBookValue) ? relatedBookValue : relatedBookValue ? [relatedBookValue] : [];
    const htmlBody = fields["Body Content"] || "";

    return {
        id: record.id,
        title: fields["Title"] || "",
        category: fields["Category"] || "",
        featuredImage: assetUrl(fields["Featured Image"]) || fields["Featured Image URL"] || "",
        excerpt: fields["Excerpt"] || "",
        bodyContent: splitLines(htmlBody),
        bodyHtml: htmlBody,
        author: fields["Author"] || "Kate Rade",
        publishDate: fields["Publish Date"] || "",
        readingTime: fields["Reading Time"] || "",
        slug: slugify(fields["Slug"] || fields["Title"] || ""),
        relatedBook,
        featured: truthy(fields["Featured"]),
        kidsCornerPost: truthy(fields["Kids Corner Post"]),
        intro: fields["Intro"] || fields["Excerpt"] || "",
        cta: {
            heading: fields["CTA Heading"] || "Explore related books",
            copy: fields["CTA Copy"] || "Browse books connected to this topic.",
            books: relatedBook.map((title) => ({
                title,
                url: "books.html"
            }))
        },
        image: assetUrl(fields["Featured Image"]) || fields["Featured Image URL"] || "",
        date: fields["Publish Date"] || "",
        body: splitLines(htmlBody)
    };
}

function mapHomepageRecord(record) {
    const fields = record.fields || {};
    return {
        id: record.id,
        heroHeadline: fields["Hero Headline"] || "",
        heroSubheadline: fields["Hero Subheadline"] || "",
        bestsellerSlug: fields["Featured Bestseller Slug"] || "",
        newReleaseSlug: fields["New Release Slug"] || "",
        seasonalFeature1: fields["Featured This Season 1"] || fields["Seasonal Feature 1 Slug"] || "",
        seasonalFeature2: fields["Featured This Season 2"] || fields["Seasonal Feature 2 Slug"] || "",
        featuredBook1: fields["Featured Book 1 Slug"] || "",
        featuredBook2: fields["Featured Book 2 Slug"] || "",
        featuredBook3: fields["Featured Book 3 Slug"] || "",
        categorySectionText: fields["Category Section Text"] || "",
        categoryDescriptions: {
            professionalTools: fields["Professional Tools Text"] || "",
            kidsFamily: fields["Kids & Family Text"] || "",
            journalsWellness: fields["Journals & Wellness Text"] || "",
            organizingSpecialty: fields["Organizing Text"] || ""
        }
    };
}

function mapAnnouncementRecord(record) {
    const fields = record.fields || {};
    return {
        id: record.id,
        text: fields["Text"] || "",
        link: fields["Link"] || "",
        active: truthy(fields["Active"])
    };
}

function mapSiteSettingsRecord(record) {
    const fields = record.fields || {};
    return {
        id: record.id,
        siteTitle: fields["Site Title"] || "Rade & Co Publishing",
        footerText: fields["Footer Text"] || "",
        contactEmail: fields["Contact Email"] || "",
        instagramUrl: fields["Instagram URL"] || "",
        facebookUrl: fields["Facebook URL"] || "",
        youtubeUrl: fields["YouTube URL"] || "",
        amazonAuthorUrl: fields["Amazon Author URL"] || "",
        tiktokUrl: fields["TikTok URL"] || ""
    };
}

function mapMediaRecord(record) {
    const fields = record.fields || {};
    return {
        id: record.id,
        title: fields["Title"] || "",
        category: fields["Category"] || "",
        imageUrl: assetUrl(fields["Image"]) || fields["Image URL"] || "",
        altText: fields["Alt Text"] || ""
    };
}

function sendJson(res, statusCode, payload) {
    res.status(statusCode).setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=3600");
    res.send(JSON.stringify(payload));
}

module.exports = {
    getConfig,
    fetchAllRecords,
    createRecord,
    updateRecord,
    deleteRecord,
    mapBookRecord,
    mapBlogPostRecord,
    mapHomepageRecord,
    mapAnnouncementRecord,
    mapSiteSettingsRecord,
    mapMediaRecord,
    sendJson
};
