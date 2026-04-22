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

    function slugTag(tag) {
        return tag.toLowerCase().replace(/\s+/g, "-");
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
                return parsed.toString();
            }
        } catch (error) {
            return "";
        }

        return "";
    }

    function renderTags(tags) {
        return (tags || []).map((tag) => `<span class="tag ${slugTag(tag)}">${tag}</span>`).join("");
    }

    function renderDetails(details) {
        return [
            { title: "Who this book is for", body: details.audience },
            { title: "What problem it solves", body: details.problem },
            { title: "What readers will get", body: details.outcome }
        ].filter((detail) => detail.body).map((detail) => `
            <article class="content-card">
                <span class="eyebrow">${detail.title}</span>
                <h3>${detail.title}</h3>
                <p>${detail.body}</p>
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
            return "\u2606\u2606\u2606\u2606\u2606";
        }
        const fullStars = Math.round(rating);
        return "\u2605".repeat(fullStars) + "\u2606".repeat(Math.max(0, 5 - fullStars));
    }

    function getGalleryImages(book) {
        const primaryImage = normalizeImageUrl(book.image || book.coverImage || book.siteImage);
        const galleryImages = Array.isArray(book.galleryImages) ? book.galleryImages.map(normalizeImageUrl) : [];
        const merged = [primaryImage, ...galleryImages]
            .map((item) => (item || "").trim())
            .filter(Boolean);

        return [...new Set(merged)];
    }

    function renderGallery(book) {
        const heroCover = document.getElementById("heroCover");
        const galleryThumbs = document.getElementById("galleryThumbs");
        const galleryImages = getGalleryImages(book);

        if (!galleryImages.length) {
            heroCover.removeAttribute("src");
            heroCover.alt = `${book.title} cover unavailable`;
            galleryThumbs.innerHTML = "";
            return;
        }

        function setActiveImage(url, buttonToActivate) {
            heroCover.src = url;
            heroCover.alt = `${book.title} cover`;
            galleryThumbs.querySelectorAll(".gallery-thumb").forEach((thumb) => thumb.classList.remove("active"));
            if (buttonToActivate) {
                buttonToActivate.classList.add("active");
            }
        }

        heroCover.onerror = () => {
            const nextImage = galleryImages.find((image) => image !== heroCover.src);
            if (nextImage) {
                heroCover.onerror = null;
                heroCover.src = nextImage;
            }
        };

        galleryThumbs.innerHTML = galleryImages.map((image, index) => `
            <button class="gallery-thumb ${index === 0 ? "active" : ""}" type="button" data-gallery-image="${image}" aria-label="View image ${index + 1}">
                <img src="${image}" alt="${book.title} thumbnail ${index + 1}">
            </button>
        `).join("");

        const thumbButtons = Array.from(galleryThumbs.querySelectorAll("[data-gallery-image]"));
        thumbButtons.forEach((button) => {
            button.addEventListener("click", () => {
                setActiveImage(button.dataset.galleryImage, button);
            });
        });

        setActiveImage(galleryImages[0], thumbButtons[0]);
    }

    function renderSpecs(book) {
        const specsGrid = document.getElementById("topSpecsGrid");
        const specs = [
            { label: "Page Count", value: book.specs && book.specs.pageCount },
            { label: "Trim Size", value: book.specs && book.specs.trimSize },
            { label: "Paper Type", value: book.specs && book.specs.paperType },
            { label: "Binding Type", value: book.specs && book.specs.bindingType }
        ].filter((entry) => entry.value);

        if (!specs.length) {
            specsGrid.innerHTML = "";
            specsGrid.style.display = "none";
            return;
        }

        specsGrid.style.display = "grid";
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

        if (!embedUrl) {
            card.innerHTML = "";
            card.style.display = "none";
            return;
        }

        card.style.display = "block";
        card.innerHTML = `
            <span class="eyebrow">Book Video</span>
            <h3>See the book in more detail</h3>
            <div class="video-embed">
                <iframe src="${embedUrl}" title="${book.title} video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </div>
        `;
    }

    function renderBookPage(book) {
        document.title = `${book.title} | Rade & Co Publishing`;
        document.getElementById("bookCategory").textContent = book.category || "";
        document.getElementById("bookTags").innerHTML = renderTags(book.tags);
        document.getElementById("bookTitle").textContent = book.title || "";
        document.getElementById("bookDescription").textContent = book.longDescription || book.shortDescription || book.description || "";
        document.getElementById("heroCta").href = book.amazonUrl || "#";
        document.getElementById("bottomCta").href = book.amazonUrl || "#";
        document.getElementById("bottomCtaTitle").textContent = `Ready to order ${book.title}?`;
        document.getElementById("bottomCtaCopy").textContent = "Keep the page simple, polished, and easy to act on with a final purchase button below.";
        document.getElementById("detailsGrid").innerHTML = renderDetails(book.details || {});
        document.getElementById("proofStars").textContent = renderProofStars(book.proof && book.proof.rating);
        document.getElementById("proofScore").textContent = book.proof && book.proof.rating ? `${book.proof.rating.toFixed(1)} / 5` : "Not yet rated";
        document.getElementById("proofCount").textContent = book.proof && book.proof.reviewCount ? `${book.proof.reviewCount} reviews` : "Review count coming soon";
        document.getElementById("proofHeadline").textContent = (book.proof && book.proof.headline) || "Review snapshot coming soon";
        document.getElementById("proofSnippet").textContent = (book.proof && book.proof.snippet) || "This area is ready for a short customer review once available.";
        document.getElementById("bonusCta").href = `../bonus.html?slug=${book.slug}`;
        document.getElementById("bonusCta").textContent = book.freeBonusTitle ? `Claim the ${book.freeBonusTitle}` : "Download the free bonus";

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

        renderBookPage(book);
        const relatedBooks = await store.getRelatedBooks(currentSlug, 3);
        document.getElementById("relatedGrid").innerHTML = renderRelated(relatedBooks);
    }

    init();
})();
