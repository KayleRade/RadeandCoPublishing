(function () {
    const fallbackLibrary = window.RADE_BLOG_LIBRARY;
    const store = window.RADE_CONTENT_STORE || (fallbackLibrary ? {
        getPostBySlug: async (slug) => fallbackLibrary.getPostBySlug(slug),
        getRelatedPosts: async (slug, limit) => fallbackLibrary.getRelatedPosts(slug, limit),
        getBooks: async () => []
    } : null);

    if (!store) {
        return;
    }

    const navToggle = document.getElementById("navToggle");
    const navLinks = document.getElementById("navLinks");
    const currentSlug = new URLSearchParams(window.location.search).get("slug") || document.body.dataset.postSlug;

    function renderBody(sections) {
        return sections.map((section) => `
            <section class="post-section">
                <h2>${section.heading}</h2>
                ${section.paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("")}
            </section>
        `).join("");
    }

    function renderRelated(posts) {
        return posts.map((post) => `
            <article class="related-card">
                <a class="related-image-link" href="blog-post-template.html?slug=${post.slug}">
                    <img src="${post.image}" alt="${post.title}">
                </a>
                <div class="related-copy">
                    <span class="category-pill">${post.category}</span>
                    <h3><a href="blog-post-template.html?slug=${post.slug}">${post.title}</a></h3>
                    <p>${post.excerpt}</p>
                    <a class="text-link" href="blog-post-template.html?slug=${post.slug}">Read More</a>
                </div>
            </article>
        `).join("");
    }

    function normalizeRelatedBookReference(value) {
        if (Array.isArray(value)) {
            return value[0] || "";
        }
        return value || "";
    }

    function slugify(value) {
        return String(value || "")
            .toLowerCase()
            .replace(/&/g, " and ")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .replace(/-{2,}/g, "-");
    }

    function resolveRelatedBook(post, books) {
        const reference = normalizeRelatedBookReference(post.relatedBook);
        if (reference) {
            const normalizedReference = slugify(reference);
            const matchedBook = books.find((book) =>
                book.id === reference ||
                book.slug === reference ||
                book.slug === normalizedReference ||
                book.title === reference
            );
            if (matchedBook) {
                return matchedBook;
            }
        }

        const ctaBook = post.cta && Array.isArray(post.cta.books) ? post.cta.books[0] : null;
        if (ctaBook && ctaBook.title) {
            return books.find((book) => book.title === ctaBook.title) || null;
        }

        return null;
    }

    function renderBookLinks(book) {
        if (!book) {
            return "";
        }

        return `
            <a class="book-link" href="books/${book.slug}.html" aria-label="View ${book.title}">
                <img src="${book.coverImage || book.image}" alt="${book.title} cover">
            </a>
            <div class="book-link-copy">
                <span class="category-pill">${book.category}</span>
                <h3><a class="text-link" href="books/${book.slug}.html">${book.title}</a></h3>
                <p>${book.shortDescription || book.longDescription || ""}</p>
                <a class="btn-secondary" href="books/${book.slug}.html">View Book</a>
            </div>
        `;
    }

    function buildShareLinks(post) {
        const postUrl = window.location.href;
        const title = post.title || document.title;
        const summary = post.excerpt || post.intro || "";
        const image = post.image || "";

        return [
            {
                label: "Facebook",
                href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`,
                external: true
            },
            {
                label: "Pinterest",
                href: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(postUrl)}&description=${encodeURIComponent(title)}${image ? `&media=${encodeURIComponent(image)}` : ""}`,
                external: true
            },
            {
                label: "LinkedIn",
                href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`,
                external: true
            },
            {
                label: "Threads",
                href: `https://www.threads.net/intent/post?text=${encodeURIComponent(`${title} ${postUrl}`)}`,
                external: true
            },
            {
                label: "Email",
                href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${summary}\n\n${postUrl}`)}`,
                external: false
            },
            {
                label: "Copy Link",
                action: "copy"
            }
        ];
    }

    function renderShareButtons(post) {
        const container = document.getElementById("shareButtons");
        const status = document.getElementById("shareStatus");
        if (!container) {
            return;
        }

        const links = buildShareLinks(post);
        container.innerHTML = links.map((entry) => {
            if (entry.action === "copy") {
                return `<button class="share-button" type="button" data-share-action="copy">Copy Link</button>`;
            }

            return `<a class="share-button" href="${entry.href}" ${entry.external ? 'target="_blank" rel="noopener noreferrer"' : ""}>${entry.label}</a>`;
        }).join("");

        const copyButton = container.querySelector('[data-share-action="copy"]');
        if (!copyButton) {
            return;
        }

        copyButton.addEventListener("click", async () => {
            try {
                await navigator.clipboard.writeText(window.location.href);
                if (status) {
                    status.textContent = "Link copied to clipboard.";
                }
            } catch (error) {
                if (status) {
                    status.textContent = "Could not copy the link automatically. Please copy the URL from your browser.";
                }
            }
        });
    }

    function upgradeBodyLinks(container) {
        container.querySelectorAll("a").forEach((link) => {
            link.setAttribute("target", "_blank");
            link.setAttribute("rel", "noopener noreferrer");
        });
    }

    function renderPost(post, relatedBook) {
        document.title = `${post.title} | Rade & Co Publishing`;
        document.getElementById("heroImage").src = post.image;
        document.getElementById("heroImage").alt = post.title;
        document.getElementById("postCategory").textContent = post.category;
        document.getElementById("postTitle").textContent = post.title;
        document.getElementById("postExcerpt").textContent = post.intro;
        document.getElementById("postAuthor").textContent = post.author;
        document.getElementById("postDate").textContent = post.date;
        document.getElementById("postReadingTime").textContent = post.readingTime;
        const postBody = document.getElementById("postBody");
        postBody.innerHTML = post.bodyHtml || renderBody(post.body);
        upgradeBodyLinks(postBody);
        const relatedBookShell = document.getElementById("relatedBookShell");
        document.getElementById("ctaBooks").innerHTML = relatedBook ? renderBookLinks(relatedBook) : "";
        if (relatedBookShell) {
            relatedBookShell.style.display = relatedBook ? "" : "none";
        }
        renderShareButtons(post);
    }

    navToggle.addEventListener("click", () => {
        const isOpen = navLinks.classList.toggle("open");
        navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    navLinks.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
            navLinks.classList.remove("open");
            navToggle.setAttribute("aria-expanded", "false");
        });
    });

    async function init() {
        const post = await store.getPostBySlug(currentSlug);
        if (!post) {
            return;
        }

        let books = [];
        let relatedBook = null;
        let relatedPosts = [];

        try {
            books = await store.getBooks();
            relatedBook = resolveRelatedBook(post, books);
        } catch (error) {
            relatedBook = null;
        }

        renderPost(post, relatedBook);

        try {
            relatedPosts = await store.getRelatedPosts(currentSlug, 3);
        } catch (error) {
            relatedPosts = [];
        }

        document.getElementById("relatedPosts").innerHTML = renderRelated(relatedPosts);
    }

    init();
})();
