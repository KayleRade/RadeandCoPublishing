(function () {
    const fallbackLibrary = window.RADE_BLOG_LIBRARY;
    const store = window.RADE_CONTENT_STORE || (fallbackLibrary ? {
        getPostBySlug: async (slug) => fallbackLibrary.getPostBySlug(slug),
        getRelatedPosts: async (slug, limit) => fallbackLibrary.getRelatedPosts(slug, limit)
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

    function renderBookLinks(books) {
        return books.map((book) => `<a class="book-link" href="${book.url}">${book.title}</a>`).join("");
    }

    function upgradeBodyLinks(container) {
        container.querySelectorAll("a").forEach((link) => {
            link.setAttribute("target", "_blank");
            link.setAttribute("rel", "noopener noreferrer");
        });
    }

    function renderPost(post) {
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
        document.getElementById("ctaTitle").textContent = post.cta.heading;
        document.getElementById("ctaCopy").textContent = post.cta.copy;
        document.getElementById("ctaBooks").innerHTML = renderBookLinks(post.cta.books);
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

        const relatedPosts = await store.getRelatedPosts(currentSlug, 3);
        renderPost(post);
        document.getElementById("relatedPosts").innerHTML = renderRelated(relatedPosts);
    }

    init();
})();
