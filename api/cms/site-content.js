const {
    getConfig,
    fetchAllRecords,
    mapHomepageRecord,
    mapAnnouncementRecord,
    mapSiteSettingsRecord,
    sendJson
} = require("./_airtable");

function normalizeHomepageReference(value, booksById) {
    if (Array.isArray(value)) {
        const first = value[0];
        if (!first) {
            return "";
        }
        const linkedBook = booksById.get(first);
        return linkedBook ? linkedBook.slug || linkedBook.title || first : first;
    }

    return value || "";
}

module.exports = async (req, res) => {
    try {
        const config = getConfig();
        const [homepageRecords, announcementRecords, siteSettingsRecords, bookRecords] = await Promise.all([
            fetchAllRecords(config.homepageTable),
            fetchAllRecords(config.announcementsTable),
            fetchAllRecords(config.siteSettingsTable),
            fetchAllRecords(config.booksTable)
        ]);

        const booksById = new Map(
            bookRecords.map((record) => [
                record.id,
                {
                    slug: record.fields && record.fields["Slug"] || "",
                    title: record.fields && record.fields["Title"] || ""
                }
            ])
        );

        const homepage = homepageRecords[0] ? mapHomepageRecord(homepageRecords[0]) : null;
        if (homepage) {
            homepage.bestsellerSlug = normalizeHomepageReference(homepage.bestsellerSlug, booksById);
            homepage.newReleaseSlug = normalizeHomepageReference(homepage.newReleaseSlug, booksById);
            homepage.seasonalFeature1 = normalizeHomepageReference(homepage.seasonalFeature1, booksById);
            homepage.seasonalFeature2 = normalizeHomepageReference(homepage.seasonalFeature2, booksById);
            homepage.featuredBook1 = normalizeHomepageReference(homepage.featuredBook1, booksById);
            homepage.featuredBook2 = normalizeHomepageReference(homepage.featuredBook2, booksById);
            homepage.featuredBook3 = normalizeHomepageReference(homepage.featuredBook3, booksById);
        }
        const announcement = announcementRecords
            .map(mapAnnouncementRecord)
            .find((entry) => entry.active) || null;
        const siteSettings = siteSettingsRecords[0] ? mapSiteSettingsRecord(siteSettingsRecords[0]) : null;

        sendJson(res, 200, {
            homepage,
            announcement,
            siteSettings
        });
    } catch (error) {
        sendJson(res, 500, {
            error: "site_content_proxy_failed",
            message: error.message
        });
    }
};
