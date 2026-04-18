const {
    getConfig,
    fetchAllRecords,
    mapHomepageRecord,
    mapAnnouncementRecord,
    mapSiteSettingsRecord,
    sendJson
} = require("./_airtable");

module.exports = async (req, res) => {
    try {
        const config = getConfig();
        const [homepageRecords, announcementRecords, siteSettingsRecords] = await Promise.all([
            fetchAllRecords(config.homepageTable),
            fetchAllRecords(config.announcementsTable),
            fetchAllRecords(config.siteSettingsTable)
        ]);

        const homepage = homepageRecords[0] ? mapHomepageRecord(homepageRecords[0]) : null;
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
