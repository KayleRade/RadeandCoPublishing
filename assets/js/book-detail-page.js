(function () {
    const fallbackLibrary = window.RADE_BOOK_LIBRARY;
    const store = window.RADE_CONTENT_STORE || (fallbackLibrary ? {
        getBookBySlug: async (slug) => fallbackLibrary.getBookBySlug(slug),
        getRelatedBooks: async (slug, limit) => fallbackLibrary.getRelatedBooks(slug, limit)
    } : null);

    if (!store) {
        return;
    }

    const navToggle = document.getElementById("navToggle");
    const navLinks = document.getElementById("navLinks");
    const currentSlug = document.body.dataset.bookSlug || window.location.pathname.split("/").pop().replace(/\.html$/i, "");

    const iconMarkup = {
        briefcase: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" aria-hidden="true"><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><path d="M4 9h16v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9Z"></path><path d="M4 12h16"></path></svg>',
        spark: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" aria-hidden="true"><path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.4L12 3Z"></path></svg>',
        grid: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" aria-hidden="true"><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"></path></svg>',
        book: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" aria-hidden="true"><path d="M7 4h9a2 2 0 0 1 2 2v14H9a2 2 0 0 0-2 2V4Z"></path><path d="M9 4a2 2 0 0 0-2 2v14"></path></svg>'
    };

    function slugTag(tag) {
        return tag.toLowerCase().replace(/\s+/g, "-");
    }

    function youtubeEmbedUrl(url) {
        if (!url) {
            return "";
        }

        try {
            const parsed = new URL(url);
            if (parsed.hostname.includes("youtu.be")) {
                return `https://www.youtube.com/embed/${parsed.pathname.replace("/", "")}`;
            }
            if (parsed.searchParams.get("v")) {
                return `https://www.youtube.com/embed/${parsed.searchParams.get("v")}`;
            }
            if (parsed.pathname.includes("/embed/")) {
                return url;
            }
        } catch (error) {
            return "";
        }

        return "";
    }

    function normalizeImageUrl(url) {
        if (!url) {
            return "";
        }

        try {
            const parsed = new URL(url, window.location.origin);
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
            return url;
        }
    }

    function renderTags(tags) {
        return tags.map((tag) => `<span class="tag ${slugTag(tag)}">${tag}</span>`).join("");
    }

    function renderDetails(details) {
        return [
            { title: "Who this book is for", body: details.audience },
            { title: "What problem it solves", body: details.problem },
            { title: "What readers will get", body: details.outcome }
        ].map((detail) => `
            <article class="content-card">
                <span class="eyebrow">${detail.title}</span>
                <h3>${detail.title}</h3>
                <p>${detail.body}</p>
            </article>
        `).join("");
    }

    function renderBenefits(benefits) {
        return benefits.map((benefit) => `
            <article class="benefit-card">
                <span class="benefit-icon">${iconMarkup[benefit.icon] || iconMarkup.book}</span>
                <h3>${benefit.title}</h3>
                <p>${benefit.body}</p>
            </article>
        `).join("");
    }

    function renderRelated(related) {
        return related.map((book) => `
            <article class="related-card">
                <a href="${book.slug}.html">
                    <img src="${normalizeImageUrl(book.image)}" alt="${book.title} cover">
                </a>
                <span class="category-pill">${book.category}</span>
                <div>
                    <h3><a href="${book.slug}.html">${book.title}</a></h3>
                    <p>${book.description}</p>
                </div>
                <div class="related-actions">
                    <a class="btn-amazon" href="${book.amazonUrl}" target="_blank" rel="noopener noreferrer">Get it on Amazon</a>
                </div>
            </article>
        `).join("");
    }

    function renderProofStars(rating) {
        if (!rating) {
            return "☆☆☆☆☆";
        }
        const fullStars = Math.round(rating);
        return "\u2605".repeat(fullStars) + "\u2606".repeat(Math.max(0, 5 - fullStars));
    }

    function ensureBookEnhancements() {
        const heroCoverShell = document.querySelector(".hero-cover-shell");
        if (!heroCoverShell) {
            return;
        }

        if (!document.getElementById("galleryThumbs")) {
            const thumbs = document.createElement("div");
            thumbs.id = "galleryThumbs";
            thumbs.className = "gallery-thumbs";
            heroCoverShell.appendChild(thumbs);
        }

        const main = document.querySelector("main");
        if (!main) {
            return;
        }

        if (!document.getElementById("bookSpecsSection")) {
            const specsSection = document.createElement("section");
            specsSection.className = "section";
            specsSection.id = "bookSpecsSection";
            specsSection.innerHTML = `
                <div class="container">
                    <div class="section-heading">
                        <span class="eyebrow">Book stats</span>
                        <h2>Format details readers often want before they buy</h2>
                        <p>Use this area for trim size, page count, paper type, binding, and other practical details.</p>
                    </div>
                    <div class="specs-grid" id="specsGrid"></div>
                </div>
            `;
            main.insertBefore(specsSection, document.getElementById("relatedGrid").closest(".section"));
        }

        const heroCopy = document.querySelector(".hero-copy");
        if (heroCopy && !document.getElementById("heroDescriptionCard")) {
            const descriptionNode = document.getElementById("bookDescription");
            const heroActions = document.querySelector(".hero-actions");
            const descriptionCard = document.createElement("div");
            descriptionCard.id = "heroDescriptionCard";
            descriptionCard.className = "hero-description-card";
            descriptionNode.parentNode.insertBefore(descriptionCard, descriptionNode);
            descriptionCard.appendChild(descriptionNode);
            if (heroActions) {
                heroCopy.insertBefore(descriptionCard, heroActions);
            }
        }

        if (heroCopy && !document.getElementById("bookVideoInline")) {
            const videoWrap = document.createElement("div");
            videoWrap.id = "bookVideoInline";
            videoWrap.className = "hero-video-card";
            heroCopy.insertBefore(videoWrap, document.querySelector(".hero-actions"));
        }

        if (!document.getElementById("bonusCta")) {
            const bonusLink = document.createElement("a");
            bonusLink.id = "bonusCta";
            bonusLink.className = "bonus-link";
            bonusLink.href = "#";
            bonusLink.textContent = "Download the free bonus";
            document.querySelector(".cta-band").appendChild(bonusLink);
        }
    }

    function renderGallery(book) {
        const heroCover = document.getElementById("heroCover");
        const galleryThumbs = document.getElementById("galleryThumbs");
        const galleryImages = Array.isArray(book.galleryImages) && book.galleryImages.length
            ? book.galleryImages.map(normalizeImageUrl)
            : [normalizeImageUrl(book.image)].filter(Boolean);

        heroCover.src = galleryImages[0] || "";
        heroCover.alt = `${book.title} cover`;
        galleryThumbs.innerHTML = galleryImages.map((image, index) => `
            <button class="gallery-thumb ${index === 0 ? "active" : ""}" type="button" data-gallery-image="${image}" aria-label="View image ${index + 1}">
                <img src="${normalizeImageUrl(image)}" alt="${book.title} thumbnail ${index + 1}">
            </button>
        `).join("");

        galleryThumbs.querySelectorAll("[data-gallery-image]").forEach((button) => {
            button.addEventListener("click", () => {
                heroCover.src = normalizeImageUrl(button.dataset.galleryImage);
                galleryThumbs.querySelectorAll(".gallery-thumb").forEach((thumb) => thumb.classList.remove("active"));
                button.classList.add("active");
            });
        });
    }

    function renderSpecs(book) {
        const specsGrid = document.getElementById("specsGrid");
        const specs = [
            { label: "Trim size", value: book.specs && book.specs.trimSize },
            { label: "Pages", value: book.specs && book.specs.pageCount },
            { label: "Paper", value: book.specs && book.specs.paperType },
            { label: "Binding", value: book.specs && book.specs.bindingType }
        ].filter((entry) => entry.value);

        if (!specs.length) {
            document.getElementById("bookSpecsSection").style.display = "none";
            return;
        }

        specsGrid.innerHTML = specs.map((spec) => `
            <article class="spec-card">
                <span class="eyebrow">${spec.label}</span>
                <h3>${spec.value}</h3>
            </article>
        `).join("");
    }

    function renderVideo(book) {
        const card = document.getElementById("bookVideoInline");
        const embedUrl = youtubeEmbedUrl(book.videoUrl);

        if (!card) {
            return;
        }

        if (!embedUrl) {
            card.style.display = "none";
            return;
        }

        card.style.display = "block";
        card.innerHTML = `
            <span class="eyebrow">Book video</span>
            <h3>See the book in more detail</h3>
            <div class="video-embed"><iframe src="${embedUrl}" title="${book.title} video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>
        `;
    }

    function renderBookPage(book) {
        ensureBookEnhancements();
        document.title = `${book.title} | Rade & Co Publishing`;
        document.getElementById("bookCategory").textContent = book.category;
        document.getElementById("bookTags").innerHTML = renderTags(book.tags);
        document.getElementById("bookTitle").textContent = book.title;
        document.getElementById("bookDescription").textContent = book.longDescription || book.description;
        document.getElementById("heroCta").href = book.amazonUrl;
        document.getElementById("heroStatOne").textContent = book.heroStats[0] || "Structured content";
        document.getElementById("heroStatTwo").textContent = book.heroStats[1] || "Conversion-ready template";
        document.getElementById("detailsGrid").innerHTML = renderDetails(book.details);
        document.getElementById("proofStars").textContent = renderProofStars(book.proof.rating);
        document.getElementById("proofScore").textContent = book.proof.rating ? `${book.proof.rating.toFixed(1)} / 5` : "Not yet rated";
        document.getElementById("proofCount").textContent = book.proof.reviewCount ? `${book.proof.reviewCount} Amazon reviews` : "Review count coming soon";
        document.getElementById("proofHeadline").textContent = book.proof.headline || "Review snapshot coming soon";
        document.getElementById("proofSnippet").textContent = book.proof.snippet || "This area is ready for a short customer review once available.";
        document.getElementById("benefitsGrid").innerHTML = renderBenefits(book.benefits);
        document.getElementById("bottomCtaTitle").textContent = `Ready to order ${book.title}?`;
        document.getElementById("bottomCtaCopy").textContent = "Keep the page simple and persuasive with one more strong invitation to purchase near the bottom.";
        document.getElementById("bottomCta").href = book.amazonUrl;
        document.getElementById("bonusCta").href = `../bonus.html?slug=${book.slug}`;
        document.getElementById("bonusCta").textContent = book.freeBonusTitle ? `Claim the ${book.freeBonusTitle}` : "Download the free bonus";

        book.image = normalizeImageUrl(book.image);
        if (Array.isArray(book.galleryImages)) {
            book.galleryImages = book.galleryImages.map(normalizeImageUrl);
        }
        renderGallery(book);
        renderSpecs(book);
        renderVideo(book);
    }

    navToggle.addEventListener("click", () => {
        const isOpen = navLinks.classList.toggle("open");
        navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    async function init() {
        const book = await store.getBookBySlug(currentSlug);
        if (!book) {
            return;
        }

        const relatedBooks = await store.getRelatedBooks(currentSlug, 3);
        renderBookPage({
            ...book,
            relatedBooks
        });
        document.getElementById("relatedGrid").innerHTML = renderRelated(relatedBooks);
    }

    init();
})();
