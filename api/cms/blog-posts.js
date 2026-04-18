const {
    getConfig,
    fetchAllRecords,
    mapBlogPostRecord,
    sendJson
} = require("./_airtable");

module.exports = async (req, res) => {
    try {
        const config = getConfig();
        const records = await fetchAllRecords(config.blogPostsTable);
        const posts = records.map(mapBlogPostRecord).filter((post) => post.slug);
        sendJson(res, 200, posts);
    } catch (error) {
        sendJson(res, 500, {
            error: "blog_posts_proxy_failed",
            message: error.message
        });
    }
};
