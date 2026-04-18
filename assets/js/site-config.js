(function () {
    window.RADE_SITE_CONFIG = {
        contentProvider: "auto",
        airtable: {
            status: "ready_for_proxy_connection",
            inviteLink: "https://airtable.com/invite/l?inviteId=invQciVTjyMSxIsTg&inviteToken=c42816bc5bde852724f8c6aed11e7b206581edf2bc2c648a91517ce5672890e2&utm_medium=email&utm_source=product_team&utm_content=transactional-alerts",
            proxyBaseUrl: "/api/cms",
            baseId: "",
            tables: {
                books: "Books",
                blogPosts: "Blog Posts"
            },
            booksFields: {
                title: "Title",
                category: "Category",
                amazonUrl: "Amazon URL",
                coverImage: "Cover Image",
                shortDescription: "Short Description",
                longDescription: "Long Description",
                rating: "Rating",
                reviewCount: "Review Count",
                featured: "Featured",
                newRelease: "New Release",
                series: "Series",
                author: "Author",
                slug: "Slug"
            },
            blogFields: {
                title: "Title",
                category: "Category",
                featuredImage: "Featured Image",
                excerpt: "Excerpt",
                bodyContent: "Body Content",
                author: "Author",
                publishDate: "Publish Date",
                readingTime: "Reading Time",
                slug: "Slug",
                relatedBook: "Related Book"
            }
        }
    };
})();
