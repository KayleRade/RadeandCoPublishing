(function () {
    const config = window.RADE_SITE_CONFIG || { contentProvider: "local" };
    const defaultSiteContent = {
        homepage: {
            heroHeadline: "Practical books, meaningful stories, and journals for real life.",
            heroSubheadline: "Rade & Co Publishing is a warm, polished brand for professionals, families, and readers who want books that feel both useful and lasting.",
            bestsellerSlug: "travel-agent-planner",
            newReleaseSlug: "true-or-false-vol-1",
            categorySectionText: "Elegant category cards make it easy to explore the full brand while keeping the homepage visually calm, premium, and easy to scan.",
            categoryDescriptions: {
                professionalTools: "Planners and guided books built to help service professionals stay organized and effective.",
                kidsFamily: "Classic-inspired stories and playful titles created for family shelves and shared reading moments.",
                journalsWellness: "Reflective, calming titles designed to support thoughtful routines and everyday wellbeing.",
                organizingSpecialty: "Practical and niche titles for readers looking for structure, hobbies, and specialty interests."
            }
        },
        announcement: null,
        siteSettings: {
            siteTitle: "Rade & Co Publishing",
            footerText: "Warm editorial design. Clear Amazon-focused conversion paths. Ready for future growth.",
            contactEmail: "",
            instagramUrl: "https://www.instagram.com/radeandcopublishing/",
            facebookUrl: "https://www.facebook.com/RadeAndCo/",
            youtubeUrl: "https://www.youtube.com/@radeandco",
            amazonAuthorUrl: "https://www.amazon.com/s?i=stripbooks&rh=p_27%3AKate%2BRade&text=Kate+Rade&ref=dp_byline_sr_book_2",
            tiktokUrl: ""
        }
    };

    function clone(data) {
        return JSON.parse(JSON.stringify(data));
    }

    function normalizeMediaUrl(value) {
        if (!value || typeof value !== "string") {
            return value || "";
        }

        try {
            const parsed = new URL(value, window.location.origin);
            if (parsed.hostname.includes("drive.google.com")) {
                if (parsed.searchParams.get("id")) {
                    return `https://drive.google.com/uc?export=view&id=${parsed.searchParams.get("id")}`;
                }
                const match = parsed.pathname.match(/\/file\/d\/([^/]+)/);
                if (match && match[1]) {
                    return `https://drive.google.com/uc?export=view&id=${match[1]}`;
                }
            }
            return parsed.toString();
        } catch (error) {
            return value;
        }
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

    function normalizeBook(book) {
        const tags = Array.isArray(book.tags) ? book.tags : [];
        const coverImage = normalizeMediaUrl(book.siteImage || book.image || book.coverImage);
        const coverImageDetail = normalizeMediaUrl(book.image || book.coverImage || book.siteImage);
        const galleryImages = [
            coverImage,
            ...(Array.isArray(book.galleryImages) ? book.galleryImages.map(normalizeMediaUrl) : [])
        ]
            .map((item) => (item || "").trim())
            .filter(Boolean)
            .filter((item, index, list) => list.indexOf(item) === index)
            .slice(0, 6);
        return {
            id: book.id || book.slug,
            title: book.title,
            category: book.category,
            amazonUrl: book.amazonUrl,
            coverImage,
            coverImageDetail,
            shortDescription: book.description || book.shortDescription,
            longDescription: book.longDescription || book.description || book.shortDescription,
            description: book.description || book.shortDescription,
            rating: book.proof ? book.proof.rating : book.rating,
            reviewCount: book.proof ? book.proof.reviewCount : book.reviewCount,
            featured: typeof book.featured === "boolean" ? book.featured : tags.includes("Bestseller") || tags.includes("New Release"),
            newRelease: typeof book.newRelease === "boolean" ? book.newRelease : tags.includes("New Release"),
            series: typeof book.series === "boolean" ? book.series : tags.includes("Series"),
            author: book.author || "Kate Rade",
            slug: slugify(book.slug || book.title),
            tags,
            heroStats: book.heroStats || [],
            galleryImages,
            specs: book.specs || {
                trimSize: "",
                pageCount: "",
                paperType: "",
                bindingType: ""
            },
            videoUrl: book.videoUrl || "",
            freeBonusTitle: book.freeBonusTitle || "Free Bonus",
            freeBonusFileUrl: book.freeBonusFileUrl || "",
            details: {
                audience: book.details && book.details.audience ? book.details.audience : "",
                problem: book.details && book.details.problem ? book.details.problem : "",
                outcome: book.details && book.details.outcome ? book.details.outcome : ""
            },
            proof: book.proof || {},
            benefits: book.benefits || [],
            siteImage: coverImage,
            image: coverImageDetail || coverImage
        };
    }

    function normalizePost(post) {
        const featuredImage = normalizeMediaUrl(post.image || post.featuredImage);
        return {
            id: post.id || post.slug,
            title: post.title,
            category: post.category,
            featuredImage,
            excerpt: post.excerpt,
            bodyContent: post.body || post.bodyContent || [],
            bodyHtml: post.bodyHtml || "",
            author: post.author,
            publishDate: post.date || post.publishDate,
            readingTime: post.readingTime,
            slug: slugify(post.slug || post.title),
            relatedBook: post.relatedBook || (post.cta && Array.isArray(post.cta.books) ? post.cta.books.map((book) => book.title) : []),
            featured: Boolean(post.featured),
            intro: post.intro || post.excerpt,
            cta: post.cta || { heading: "", copy: "", books: [] },
            image: featuredImage,
            date: post.date || post.publishDate,
            body: post.body || post.bodyContent || []
        };
    }

    function getLocalBooks() {
        const library = window.RADE_BOOK_LIBRARY;
        if (!library) {
            return [];
        }
        return library.getAllBooks().map(normalizeBook);
    }

    function getLocalPosts() {
        const library = window.RADE_BLOG_LIBRARY;
        if (!library) {
            return [];
        }
        return library.getAllPosts().map(normalizePost);
    }

    async function getRemoteContent(type) {
        const baseUrl = config.airtable && config.airtable.proxyBaseUrl;
        if (!baseUrl) {
            return [];
        }

        const response = await fetch(`${baseUrl.replace(/\/$/, "")}/${type}`, {
            headers: {
                Accept: "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`Unable to load ${type} data`);
        }

        return response.json();
    }

    async function resolveBooks() {
        if (config.contentProvider !== "local") {
            try {
                const books = await getRemoteContent("books");
                return books.map(normalizeBook);
            } catch (error) {
                if (config.contentProvider === "airtable-proxy") {
                    throw error;
                }
            }
        }
        return getLocalBooks();
    }

    async function resolvePosts() {
        if (config.contentProvider !== "local") {
            try {
                const posts = await getRemoteContent("blog-posts");
                return posts.map(normalizePost);
            } catch (error) {
                if (config.contentProvider === "airtable-proxy") {
                    throw error;
                }
            }
        }
        return getLocalPosts();
    }

    async function resolveSiteContent() {
        if (config.contentProvider !== "local") {
            try {
                const remote = await getRemoteContent("site-content");
                return {
                    homepage: remote.homepage || clone(defaultSiteContent.homepage),
                    announcement: remote.announcement || null,
                    siteSettings: remote.siteSettings || clone(defaultSiteContent.siteSettings)
                };
            } catch (error) {
                if (config.contentProvider === "airtable-proxy") {
                    throw error;
                }
            }
        }
        return clone(defaultSiteContent);
    }

    function byCategory(items, category) {
        if (!category || category === "all") {
            return items;
        }
        return items.filter((item) => item.category === category);
    }

    window.RADE_CONTENT_STORE = {
        getConfig() {
            return clone(config);
        },
        async getBooks() {
            return clone(await resolveBooks());
        },
        async getBookBySlug(slug) {
            const books = await resolveBooks();
            const normalizedSlug = slugify(slug);
            return clone(books.find((book) => book.slug === normalizedSlug) || null);
        },
        async getBooksByCategory(category) {
            return clone(byCategory(await resolveBooks(), category));
        },
        async getFeaturedBooks(limit) {
            const books = await resolveBooks();
            const featured = books.filter((book) => book.featured);
            const fallback = books.filter((book) => !featured.some((entry) => entry.slug === book.slug));
            return clone([...featured, ...fallback].slice(0, limit || 4));
        },
        async getBestsellerBook() {
            const homepage = await this.getHomepageContent();
            if (homepage && homepage.bestsellerSlug) {
                const selected = await this.getBookBySlug(homepage.bestsellerSlug);
                if (selected) {
                    return selected;
                }
            }
            const books = await resolveBooks();
            return clone(books.find((book) => book.tags.includes("Bestseller")) || books[0] || null);
        },
        async getNewReleaseBook() {
            const homepage = await this.getHomepageContent();
            if (homepage && homepage.newReleaseSlug) {
                const selected = await this.getBookBySlug(homepage.newReleaseSlug);
                if (selected) {
                    return selected;
                }
            }
            const books = await resolveBooks();
            return clone(books.find((book) => book.newRelease) || null);
        },
        async getRelatedBooks(slug, limit) {
            const books = await resolveBooks();
            const normalizedSlug = slugify(slug);
            const current = books.find((book) => book.slug === normalizedSlug);
            if (!current) {
                return clone(books.filter((book) => book.slug !== normalizedSlug).slice(0, limit || 3));
            }

            const sameCategory = books.filter((book) => book.slug !== normalizedSlug && book.category === current.category);
            const nearby = books.filter((book) => book.slug !== normalizedSlug && book.category !== current.category);
            return clone([...sameCategory, ...nearby].slice(0, limit || 3));
        },
        async getBlogPosts() {
            return clone(await resolvePosts());
        },
        async getBlogPostsByCategory(category) {
            return clone(byCategory(await resolvePosts(), category));
        },
        async getFeaturedPost() {
            const posts = await resolvePosts();
            return clone(posts.find((post) => post.featured) || posts[0] || null);
        },
        async getPostBySlug(slug) {
            const posts = await resolvePosts();
            return clone(posts.find((post) => post.slug === slug) || null);
        },
        async getHomepagePosts(limit) {
            const posts = await resolvePosts();
            return clone(posts.slice(0, limit || 3));
        },
        async getRelatedPosts(slug, limit) {
            const posts = await resolvePosts();
            const current = posts.find((post) => post.slug === slug);
            if (!current) {
                return [];
            }

            const sameCategory = posts.filter((post) => post.slug !== slug && post.category === current.category);
            const nearby = posts.filter((post) => post.slug !== slug && post.category !== current.category);
            return clone([...sameCategory, ...nearby].slice(0, limit || 3));
        },
        async getHomepageContent() {
            const siteContent = await resolveSiteContent();
            return clone(siteContent.homepage);
        },
        async getAnnouncement() {
            const siteContent = await resolveSiteContent();
            return clone(siteContent.announcement);
        },
        async getSiteSettings() {
            const siteContent = await resolveSiteContent();
            return clone(siteContent.siteSettings);
        }
    };
})();
