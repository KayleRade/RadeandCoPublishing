const {
    getConfig,
    fetchAllRecords,
    mapBookRecord,
    mapBlogPostRecord,
    sendJson
} = require("../cms/_airtable");
const { ensureAuthenticated } = require("./_auth");

module.exports = async (req, res) => {
    try {
        await ensureAuthenticated(req);
        const config = getConfig();
        const [bookRecords, postRecords] = await Promise.all([
            fetchAllRecords(config.booksTable),
            fetchAllRecords(config.blogPostsTable)
        ]);

        const books = bookRecords.map(mapBookRecord);
        const posts = postRecords.map(mapBlogPostRecord);

        sendJson(res, 200, {
            totalBooks: books.length,
            totalBlogPosts: posts.length,
            featuredBooks: books.filter((book) => book.featured).length,
            newReleases: books.filter((book) => book.newRelease).length
        });
    } catch (error) {
        sendJson(res, error.statusCode || 500, {
            error: "dashboard_failed",
            message: error.message
        });
    }
};
