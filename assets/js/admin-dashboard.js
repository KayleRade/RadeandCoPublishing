(function () {
    const sectionButtons = Array.from(document.querySelectorAll("[data-section]"));
    const panels = Array.from(document.querySelectorAll(".admin-panel"));
    const logoutButton = document.getElementById("logoutButton");
    const currentAdminEmail = document.getElementById("currentAdminEmail");
    const postEditor = document.getElementById("postEditor");
    const toolbarButtons = Array.from(document.querySelectorAll("[data-editor-command]"));
    const bookDescriptionEditor = document.getElementById("bookDescriptionEditor");
    const descriptionToolbarButtons = Array.from(document.querySelectorAll("[data-description-command]"));
    const coverImageCurrent = document.getElementById("coverImageCurrent");
    const galleryImagesCurrent = document.getElementById("galleryImagesCurrent");
    const coverImagePreview = document.getElementById("coverImagePreview");
    const galleryImagesPreview = document.getElementById("galleryImagesPreview");

    const state = {
        session: null,
        books: [],
        posts: [],
        homepage: null,
        announcements: [],
        media: [],
        settings: null
    };

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

    function setStatus(id, message) {
        const node = document.getElementById(id);
        if (node) {
            node.textContent = message || "";
        }
    }

    async function request(path, options) {
        const response = await fetch(path, {
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json"
            },
            ...options
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || "Request failed.");
        }
        return data;
    }

    function formToObject(form) {
        const payload = {};
        const formData = new FormData(form);
        formData.forEach((value, key) => {
            if (value instanceof File) {
                return;
            }
            payload[key] = value;
        });
        form.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
            payload[checkbox.name] = checkbox.checked;
        });
        return payload;
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function imageNameFromUrl(url, fallback) {
        try {
            const pathname = new URL(url, window.location.origin).pathname;
            const parts = pathname.split("/").filter(Boolean);
            return parts[parts.length - 1] || fallback;
        } catch (error) {
            return fallback;
        }
    }

    function isPdfUrl(url) {
        return /\.pdf(?:$|[?#])/i.test(String(url || ""));
    }

    function renderImagePreview(container, images, options) {
        if (!container) {
            return;
        }

        const normalized = (Array.isArray(images) ? images : [])
            .map((image) => String(image || "").trim())
            .filter(Boolean);

        if (!normalized.length) {
            container.innerHTML = "";
            return;
        }

        container.innerHTML = normalized.map((image, index) => {
            const label = escapeHtml(imageNameFromUrl(image, `${(options && options.labelPrefix) || "Image"} ${index + 1}`));
            if (isPdfUrl(image)) {
                return `
                    <figure class="admin-image-thumb is-file">
                        <div class="admin-file-thumb">
                            <strong>PDF</strong>
                            <a href="${escapeHtml(image)}" target="_blank" rel="noopener noreferrer">${label}</a>
                        </div>
                    </figure>
                `;
            }

            return `
                <figure class="admin-image-thumb">
                    <img src="${escapeHtml(image)}" alt="${escapeHtml((options && options.altPrefix) || "Uploaded image")} ${index + 1}">
                    <span>${label}</span>
                </figure>
            `;
        }).join("");
    }

    function resetForm(form, extra) {
        form.reset();
        form.querySelectorAll('input[type="hidden"]').forEach((input) => {
            input.value = "";
        });
        if (typeof extra === "function") {
            extra();
        }
    }

    function wireSlugField(formId) {
        const form = document.getElementById(formId);
        if (!form) {
            return;
        }
        const titleInput = form.elements.title;
        const slugInput = form.elements.slug;
        if (!titleInput || !slugInput) {
            return;
        }

        function maybeUpdateSlug() {
            if (!slugInput.dataset.touched || slugInput.value.trim() === "") {
                slugInput.value = slugify(titleInput.value);
            }
        }

        titleInput.addEventListener("input", maybeUpdateSlug);
        slugInput.addEventListener("input", () => {
            slugInput.dataset.touched = slugInput.value.trim() ? "true" : "";
        });
    }

    function openSection(section) {
        sectionButtons.forEach((button) => {
            button.classList.toggle("active", button.dataset.section === section);
        });
        panels.forEach((panel) => {
            panel.classList.toggle("active", panel.id === `panel-${section}`);
        });
    }

    function renderOverview(stats) {
        document.getElementById("statBooks").textContent = stats.totalBooks || 0;
        document.getElementById("statPosts").textContent = stats.totalBlogPosts || 0;
        document.getElementById("statFeatured").textContent = stats.featuredBooks || 0;
        document.getElementById("statNewReleases").textContent = stats.newReleases || 0;
    }

    function renderBooks() {
        const list = document.getElementById("booksList");
        list.innerHTML = state.books.map((book) => `
            <article class="admin-list-item">
                <img src="${book.image || book.coverImage || ""}" alt="${book.title}">
                <div>
                    <strong>${book.title}</strong>
                    <p class="admin-muted">${book.category}</p>
                    <p class="admin-muted">${book.shortDescription || ""}</p>
                </div>
                <div class="admin-list-actions">
                    <button class="admin-button admin-button-secondary" type="button" data-book-edit="${book.id}">Edit</button>
                    <button class="admin-button admin-button-secondary" type="button" data-book-delete="${book.id}">Delete</button>
                </div>
            </article>
        `).join("");

        list.querySelectorAll("[data-book-edit]").forEach((button) => {
            button.addEventListener("click", () => fillBookForm(button.dataset.bookEdit));
        });

        list.querySelectorAll("[data-book-delete]").forEach((button) => {
            button.addEventListener("click", () => deleteBook(button.dataset.bookDelete));
        });

        const bestsellerSelect = document.getElementById("homepageBestsellerSelect");
        const releaseSelect = document.getElementById("homepageReleaseSelect");
        const options = state.books.map((book) => `<option value="${book.slug}">${book.title}</option>`).join("");
        bestsellerSelect.innerHTML = `<option value="">Select a book</option>${options}`;
        releaseSelect.innerHTML = `<option value="">Select a book</option>${options}`;

        if (state.homepage) {
            bestsellerSelect.value = state.homepage.bestsellerSlug || "";
            releaseSelect.value = state.homepage.newReleaseSlug || "";
        }
    }

    function fillBookForm(id) {
        const book = state.books.find((entry) => entry.id === id);
        if (!book) {
            return;
        }
        const form = document.getElementById("bookForm");
        form.elements.id.value = book.id;
        form.elements.title.value = book.title || "";
        form.elements.slug.value = book.slug || "";
        form.elements.category.value = book.category || "Professional Tools";
        form.elements.amazonUrl.value = book.amazonUrl || "";
        const currentCoverImage = book.image || book.coverImage || (Array.isArray(book.galleryImages) ? book.galleryImages[0] : "") || "";
        if (coverImageCurrent) {
            coverImageCurrent.textContent = currentCoverImage
                ? "Current Airtable cover image shown below. Please use Airtable to replace it."
                : "No cover image is currently saved. Please upload the cover directly in Airtable.";
        }
        renderImagePreview(coverImagePreview, currentCoverImage ? [currentCoverImage] : [], { altPrefix: "Cover image", labelPrefix: "Cover" });
        form.elements.shortDescription.value = book.shortDescription || "";
        form.elements.longDescription.value = book.longDescription || "";
        if (bookDescriptionEditor) {
            bookDescriptionEditor.innerHTML = book.longDescription || "";
        }
        form.elements.author.value = book.author || "Kate Rade";
        form.elements.rating.value = book.rating || "";
        form.elements.reviewCount.value = book.reviewCount || "";
        if (galleryImagesCurrent) {
            galleryImagesCurrent.textContent = Array.isArray(book.galleryImages) && book.galleryImages.length
                ? "Current Airtable gallery images shown below. Please use Airtable to replace them."
                : "No gallery images are currently saved. Please upload gallery images directly in Airtable.";
        }
        renderImagePreview(galleryImagesPreview, Array.isArray(book.galleryImages) ? book.galleryImages : [], { altPrefix: "Gallery image", labelPrefix: "Gallery" });
        form.elements.trimSize.value = book.specs && book.specs.trimSize ? book.specs.trimSize : "";
        form.elements.pageCount.value = book.specs && book.specs.pageCount ? book.specs.pageCount : "";
        form.elements.paperType.value = book.specs && book.specs.paperType ? book.specs.paperType : "";
        form.elements.bindingType.value = book.specs && book.specs.bindingType ? book.specs.bindingType : "";
        form.elements.videoUrl.value = book.videoUrl || "";
        form.elements.freeBonusTitle.value = book.freeBonusTitle || "";
        form.elements.freeBonusFileUrl.value = book.freeBonusFileUrl || "";
        form.elements.audience.value = (book.details && book.details.audience) || "";
        form.elements.problem.value = (book.details && book.details.problem) || "";
        form.elements.outcome.value = (book.details && book.details.outcome) || "";
        form.elements.reviewHeadline.value = (book.proof && book.proof.headline) || "";
        form.elements.reviewSnippet.value = (book.proof && book.proof.snippet) || "";
        form.elements.featured.checked = Boolean(book.featured);
        form.elements.newRelease.checked = Boolean(book.newRelease);
        form.elements.series.checked = Boolean(book.series);
        setStatus("bookStatus", `Editing ${book.title}`);
    }

    async function deleteBook(id) {
        if (!window.confirm("Delete this book?")) {
            return;
        }
        await request("../api/admin/books", {
            method: "DELETE",
            body: JSON.stringify({ id })
        });
        await loadBooks();
        await loadOverview();
    }

    function renderPosts() {
        const list = document.getElementById("postsList");
        list.innerHTML = state.posts.map((post) => `
            <article class="admin-list-item">
                <img src="${post.image || post.featuredImage || ""}" alt="${post.title}">
                <div>
                    <strong>${post.title}</strong>
                    <p class="admin-muted">${post.category}</p>
                    <p class="admin-muted">${post.excerpt || ""}</p>
                </div>
                <div class="admin-list-actions">
                    <button class="admin-button admin-button-secondary" type="button" data-post-edit="${post.id}">Edit</button>
                    <button class="admin-button admin-button-secondary" type="button" data-post-delete="${post.id}">Delete</button>
                </div>
            </article>
        `).join("");

        list.querySelectorAll("[data-post-edit]").forEach((button) => {
            button.addEventListener("click", () => fillPostForm(button.dataset.postEdit));
        });

        list.querySelectorAll("[data-post-delete]").forEach((button) => {
            button.addEventListener("click", () => deletePost(button.dataset.postDelete));
        });
    }

    function fillPostForm(id) {
        const post = state.posts.find((entry) => entry.id === id);
        if (!post) {
            return;
        }
        const form = document.getElementById("postForm");
        form.elements.id.value = post.id;
        form.elements.title.value = post.title || "";
        form.elements.slug.value = post.slug || "";
        form.elements.category.value = post.category || "";
        form.elements.featuredImage.value = post.image || post.featuredImage || "";
        form.elements.excerpt.value = post.excerpt || "";
        form.elements.intro.value = post.intro || "";
        form.elements.author.value = post.author || "Kate Rade";
        form.elements.publishDate.value = post.date || post.publishDate || "";
        form.elements.readingTime.value = post.readingTime || "";
        form.elements.relatedBook.value = Array.isArray(post.relatedBook) ? post.relatedBook.join(", ") : (post.relatedBook || "");
        form.elements.ctaHeading.value = post.cta && post.cta.heading ? post.cta.heading : "";
        form.elements.ctaCopy.value = post.cta && post.cta.copy ? post.cta.copy : "";
        form.elements.featured.checked = Boolean(post.featured);
        postEditor.innerHTML = post.bodyHtml || "";
        setStatus("postStatus", `Editing ${post.title}`);
    }

    async function deletePost(id) {
        if (!window.confirm("Delete this post?")) {
            return;
        }
        await request("../api/admin/posts", {
            method: "DELETE",
            body: JSON.stringify({ id })
        });
        await loadPosts();
        await loadOverview();
    }

    function renderHomepage() {
        if (!state.homepage) {
            return;
        }
        const form = document.getElementById("homepageForm");
        form.elements.heroHeadline.value = state.homepage.heroHeadline || "";
        form.elements.heroSubheadline.value = state.homepage.heroSubheadline || "";
        form.elements.categorySectionText.value = state.homepage.categorySectionText || "";
        form.elements.professionalToolsText.value = state.homepage.categoryDescriptions.professionalTools || "";
        form.elements.kidsFamilyText.value = state.homepage.categoryDescriptions.kidsFamily || "";
        form.elements.journalsWellnessText.value = state.homepage.categoryDescriptions.journalsWellness || "";
        form.elements.organizingText.value = state.homepage.categoryDescriptions.organizingSpecialty || "";
        form.elements.bestsellerSlug.value = state.homepage.bestsellerSlug || "";
        form.elements.newReleaseSlug.value = state.homepage.newReleaseSlug || "";
    }

    function renderAnnouncements() {
        const list = document.getElementById("announcementsList");
        list.innerHTML = state.announcements.map((announcement) => `
            <article class="admin-list-item">
                <img src="https://dummyimage.com/160x200/fbf6ef/2d2926&text=Banner" alt="Announcement placeholder">
                <div>
                    <strong>${announcement.text}</strong>
                    <p class="admin-muted">${announcement.link || "No link"}</p>
                    <p class="admin-muted">${announcement.active ? "Active" : "Inactive"}</p>
                </div>
                <div class="admin-list-actions">
                    <button class="admin-button admin-button-secondary" type="button" data-announcement-edit="${announcement.id}">Edit</button>
                    <button class="admin-button admin-button-secondary" type="button" data-announcement-delete="${announcement.id}">Delete</button>
                </div>
            </article>
        `).join("");

        list.querySelectorAll("[data-announcement-edit]").forEach((button) => {
            button.addEventListener("click", () => fillAnnouncementForm(button.dataset.announcementEdit));
        });
        list.querySelectorAll("[data-announcement-delete]").forEach((button) => {
            button.addEventListener("click", () => deleteAnnouncement(button.dataset.announcementDelete));
        });
    }

    function fillAnnouncementForm(id) {
        const announcement = state.announcements.find((entry) => entry.id === id);
        if (!announcement) {
            return;
        }
        const form = document.getElementById("announcementForm");
        form.elements.id.value = announcement.id;
        form.elements.text.value = announcement.text || "";
        form.elements.link.value = announcement.link || "";
        form.elements.active.checked = Boolean(announcement.active);
        setStatus("announcementStatus", "Editing announcement");
    }

    async function deleteAnnouncement(id) {
        if (!window.confirm("Delete this announcement?")) {
            return;
        }
        await request("../api/admin/announcements", {
            method: "DELETE",
            body: JSON.stringify({ id })
        });
        await loadAnnouncements();
    }

    function renderMedia() {
        const list = document.getElementById("mediaList");
        list.innerHTML = state.media.map((item) => `
            <article class="admin-list-item">
                <img src="${item.imageUrl}" alt="${item.altText || item.title}">
                <div>
                    <strong>${item.title}</strong>
                    <p class="admin-muted">${item.category || "Uncategorized"}</p>
                    <p class="admin-muted">${item.imageUrl}</p>
                </div>
                <div class="admin-list-actions">
                    <button class="admin-button admin-button-secondary" type="button" data-media-edit="${item.id}">Edit</button>
                    <button class="admin-button admin-button-secondary" type="button" data-media-delete="${item.id}">Delete</button>
                </div>
            </article>
        `).join("");

        list.querySelectorAll("[data-media-edit]").forEach((button) => {
            button.addEventListener("click", () => fillMediaForm(button.dataset.mediaEdit));
        });
        list.querySelectorAll("[data-media-delete]").forEach((button) => {
            button.addEventListener("click", () => deleteMedia(button.dataset.mediaDelete));
        });
    }

    function fillMediaForm(id) {
        const item = state.media.find((entry) => entry.id === id);
        if (!item) {
            return;
        }
        const form = document.getElementById("mediaForm");
        form.elements.id.value = item.id;
        form.elements.title.value = item.title || "";
        form.elements.category.value = item.category || "";
        form.elements.imageUrl.value = item.imageUrl || "";
        form.elements.altText.value = item.altText || "";
        setStatus("mediaStatus", "Editing media item");
    }

    async function deleteMedia(id) {
        if (!window.confirm("Delete this media item?")) {
            return;
        }
        await request("../api/admin/media", {
            method: "DELETE",
            body: JSON.stringify({ id })
        });
        await loadMedia();
    }

    function renderSettings() {
        const form = document.getElementById("settingsForm");
        const settings = state.settings || {};
        form.elements.siteTitle.value = settings.siteTitle || "";
        form.elements.footerText.value = settings.footerText || "";
        form.elements.contactEmail.value = settings.contactEmail || "";
        form.elements.instagramUrl.value = settings.instagramUrl || "";
        form.elements.facebookUrl.value = settings.facebookUrl || "";
        form.elements.youtubeUrl.value = settings.youtubeUrl || "";
        form.elements.amazonAuthorUrl.value = settings.amazonAuthorUrl || "";
        form.elements.tiktokUrl.value = settings.tiktokUrl || "";
        form.elements.adminName.value = state.session && state.session.user ? state.session.user.name || "" : "";
        form.elements.adminEmail.value = state.session && state.session.user ? state.session.user.email || "" : "";
    }

    async function loadOverview() {
        renderOverview(await request("../api/admin/dashboard"));
    }

    async function loadBooks() {
        state.books = await request("../api/admin/books");
        renderBooks();
    }

    async function loadPosts() {
        state.posts = await request("../api/admin/posts");
        renderPosts();
    }

    async function loadHomepage() {
        state.homepage = await request("../api/admin/homepage");
        renderHomepage();
    }

    async function loadAnnouncements() {
        state.announcements = await request("../api/admin/announcements");
        renderAnnouncements();
    }

    async function loadMedia() {
        state.media = await request("../api/admin/media");
        renderMedia();
    }

    async function loadSettings() {
        state.settings = await request("../api/admin/settings");
        renderSettings();
    }

    async function loadAll() {
        await Promise.all([
            loadOverview(),
            loadBooks(),
            loadPosts(),
            loadAnnouncements(),
            loadMedia(),
            loadSettings()
        ]);
        await loadHomepage();
    }

    async function ensureSession() {
        const session = await request("../api/admin/session");
        if (!session.authenticated) {
            window.location.href = "./login.html";
            return false;
        }
        state.session = session;
        currentAdminEmail.textContent = session.user.email;
        return true;
    }

    document.getElementById("bookForm").addEventListener("submit", async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const payload = formToObject(form);
        payload.longDescription = bookDescriptionEditor ? bookDescriptionEditor.innerHTML : payload.longDescription;
        try {
            await request("../api/admin/books", {
                method: payload.id ? "PUT" : "POST",
                body: JSON.stringify(payload)
            });
            setStatus("bookStatus", "Book saved.");
            resetForm(form, () => {
                if (bookDescriptionEditor) {
                    bookDescriptionEditor.innerHTML = "";
                }
                if (coverImageCurrent) {
                    coverImageCurrent.textContent = "Please use Airtable to upload or replace the cover image for this book. The current saved image will appear below when available.";
                }
                if (galleryImagesCurrent) {
                    galleryImagesCurrent.textContent = "Please use Airtable to upload or manage gallery images for this book. Current saved gallery images will appear below when available.";
                }
                renderImagePreview(coverImagePreview, []);
                renderImagePreview(galleryImagesPreview, []);
            });
            await loadBooks();
            await loadOverview();
        } catch (error) {
            setStatus("bookStatus", error.message);
        }
    });

    document.getElementById("resetBookForm").addEventListener("click", () => {
        resetForm(document.getElementById("bookForm"), () => {
            if (bookDescriptionEditor) {
                bookDescriptionEditor.innerHTML = "";
            }
            if (coverImageCurrent) {
                coverImageCurrent.textContent = "Please use Airtable to upload or replace the cover image for this book. The current saved image will appear below when available.";
            }
            if (galleryImagesCurrent) {
                galleryImagesCurrent.textContent = "Please use Airtable to upload or manage gallery images for this book. Current saved gallery images will appear below when available.";
            }
            renderImagePreview(coverImagePreview, []);
            renderImagePreview(galleryImagesPreview, []);
        });
        setStatus("bookStatus", "");
    });

    document.getElementById("postForm").addEventListener("submit", async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const payload = formToObject(form);
        payload.bodyContent = postEditor.innerHTML;
        try {
            await request("../api/admin/posts", {
                method: payload.id ? "PUT" : "POST",
                body: JSON.stringify(payload)
            });
            setStatus("postStatus", "Post saved.");
            resetForm(form, () => {
                postEditor.innerHTML = "";
            });
            await loadPosts();
            await loadOverview();
        } catch (error) {
            setStatus("postStatus", error.message);
        }
    });

    document.getElementById("resetPostForm").addEventListener("click", () => {
        resetForm(document.getElementById("postForm"), () => {
            postEditor.innerHTML = "";
        });
        setStatus("postStatus", "");
    });

    document.getElementById("homepageForm").addEventListener("submit", async (event) => {
        event.preventDefault();
        const payload = formToObject(event.currentTarget);
        try {
            state.homepage = await request("../api/admin/homepage", {
                method: "PUT",
                body: JSON.stringify(payload)
            });
            renderHomepage();
            setStatus("homepageStatus", "Homepage content saved.");
        } catch (error) {
            setStatus("homepageStatus", error.message);
        }
    });

    document.getElementById("announcementForm").addEventListener("submit", async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const payload = formToObject(form);
        try {
            await request("../api/admin/announcements", {
                method: payload.id ? "PUT" : "POST",
                body: JSON.stringify(payload)
            });
            setStatus("announcementStatus", "Announcement saved.");
            resetForm(form);
            await loadAnnouncements();
        } catch (error) {
            setStatus("announcementStatus", error.message);
        }
    });

    document.getElementById("resetAnnouncementForm").addEventListener("click", () => {
        resetForm(document.getElementById("announcementForm"));
        setStatus("announcementStatus", "");
    });

    document.getElementById("mediaForm").addEventListener("submit", async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const payload = formToObject(form);
        try {
            await request("../api/admin/media", {
                method: payload.id ? "PUT" : "POST",
                body: JSON.stringify(payload)
            });
            setStatus("mediaStatus", "Media item saved.");
            resetForm(form);
            await loadMedia();
        } catch (error) {
            setStatus("mediaStatus", error.message);
        }
    });

    document.getElementById("resetMediaForm").addEventListener("click", () => {
        resetForm(document.getElementById("mediaForm"));
        setStatus("mediaStatus", "");
    });

    document.getElementById("settingsForm").addEventListener("submit", async (event) => {
        event.preventDefault();
        const payload = formToObject(event.currentTarget);
        try {
            state.settings = await request("../api/admin/settings", {
                method: "PUT",
                body: JSON.stringify(payload)
            });
            setStatus("settingsStatus", "Settings saved.");
        } catch (error) {
            setStatus("settingsStatus", error.message);
        }
    });

    sectionButtons.forEach((button) => {
        button.addEventListener("click", () => openSection(button.dataset.section));
    });

    toolbarButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const command = button.dataset.editorCommand;
            const value = button.dataset.editorValue || null;
            document.execCommand(command, false, value);
            postEditor.focus();
        });
    });

    descriptionToolbarButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const command = button.dataset.descriptionCommand;
            const value = button.dataset.descriptionValue || null;
            document.execCommand(command, false, value);
            if (bookDescriptionEditor) {
                bookDescriptionEditor.focus();
            }
        });
    });

    logoutButton.addEventListener("click", async () => {
        await request("../api/admin/logout", { method: "POST" });
        window.location.href = "./login.html";
    });

    wireSlugField("bookForm");
    wireSlugField("postForm");

    (async function init() {
        try {
            if (await ensureSession()) {
                await loadAll();
            }
        } catch (error) {
            window.location.href = "./login.html";
        }
    })();
})();
