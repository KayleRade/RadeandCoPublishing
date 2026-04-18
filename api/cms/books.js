const {
    getConfig,
    fetchAllRecords,
    mapBookRecord,
    sendJson
} = require("./_airtable");

module.exports = async (req, res) => {
    try {
        const config = getConfig();
        const records = await fetchAllRecords(config.booksTable);
        const books = records.map(mapBookRecord).filter((book) => book.slug);
        sendJson(res, 200, books);
    } catch (error) {
        sendJson(res, 500, {
            error: "books_proxy_failed",
            message: error.message
        });
    }
};
