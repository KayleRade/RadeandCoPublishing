(function () {
    const store = window.RADE_CONTENT_STORE;
    if (!store) {
        return;
    }

    function getPathPrefix() {
        const path = window.location.pathname.toLowerCase();
        if (path.includes("/books/")) {
            return "../";
        }
        return "";
    }

    function buildLink(prefix, href) {
        return `${prefix}${href}`;
    }

    function normalizeDocumentTitle() {
        if (/By Kate Rade/i.test(document.title)) {
            document.title = document.title.replace(/\s*\|\s*By Kate Rade/i, "").replace(/Rade\s*&\s*Co Publishing by Kate Rade/gi, "Rade & Co Publishing");
        }
    }

    function getPageKey() {
        const path = window.location.pathname.toLowerCase();
        if (path.endsWith("/books.html") || path.includes("/books/")) {
            return "books";
        }
        if (path.endsWith("/kids-corner.html")) {
            return "kids";
        }
        if (path.endsWith("/blog.html") || path.endsWith("/blog-post-template.html")) {
            return "blog";
        }
        if (path.endsWith("/about.html")) {
            return "about";
        }
        if (path.endsWith("/contact-rights.html")) {
            return "contact";
        }
        return "home";
    }

    function injectSharedStyles() {
        if (document.getElementById("siteShellStyles")) {
            return;
        }
        const style = document.createElement("style");
        style.id = "siteShellStyles";
        style.textContent = `
            .site-announcement {
                padding: 0.8rem 1rem;
                text-align: center;
                background: linear-gradient(135deg, #2d2926 0%, #5b4940 100%);
                color: #fff;
                font: 600 0.95rem/1.4 "Manrope", sans-serif;
            }

            .site-announcement a,
            .site-announcement span {
                color: inherit;
                text-decoration: none;
            }

            .footer-socials {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                flex-wrap: wrap;
                margin-top: 0.8rem;
            }

            .footer-socials .social-pill {
                width: 42px;
                height: 42px;
                border-radius: 50%;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                background: rgba(255, 255, 255, 0.92);
                border: 1px solid rgba(45, 41, 38, 0.08);
                color: #2d2926;
                box-shadow: 0 10px 24px rgba(45, 41, 38, 0.08);
            }

            .footer-socials .social-pill svg {
                width: 18px;
                height: 18px;
                fill: currentColor;
            }
        `;
        document.head.appendChild(style);
    }

    function iconSvg(name) {
        const icons = {
            instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2.2A2.8 2.8 0 0 0 4.2 7v10A2.8 2.8 0 0 0 7 19.8h10a2.8 2.8 0 0 0 2.8-2.8V7A2.8 2.8 0 0 0 17 4.2H7Zm10.2 1.6a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6Z"/></svg>',
            facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.3 22v-8.2h2.8l.4-3.2h-3.2V8.6c0-.9.2-1.5 1.5-1.5h1.8V4.2c-.3 0-1.4-.1-2.6-.1-2.6 0-4.3 1.6-4.3 4.5v2.1H7.8v3.2h2.9V22h2.6Z"/></svg>',
            youtube: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M23 12s0-3.3-.4-4.9a3 3 0 0 0-2.1-2.1C18.9 4.6 12 4.6 12 4.6s-6.9 0-8.5.4a3 3 0 0 0-2.1 2.1C1 8.7 1 12 1 12s0 3.3.4 4.9a3 3 0 0 0 2.1 2.1c1.6.4 8.5.4 8.5.4s6.9 0 8.5-.4a3 3 0 0 0 2.1-2.1c.4-1.6.4-4.9.4-4.9ZM9.8 15.5V8.5l6 3.5-6 3.5Z"/></svg>',
            amazon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.7 18.7c3.3 2 7.6 3 11.4 3 2.8 0 5.9-.6 8.2-1.7.4-.2.1-.9-.4-.8-2.5.6-5.2.9-7.8.9-3.7 0-7.8-.8-11.1-2.5-.3-.2-.6.3-.3.5ZM24.5 17.6c-.3-.4-1.9-.2-2.6-.1-.2 0-.2-.2 0-.3 1.1-.8 2.9-.6 3.1-.3.2.3-.1 2-.9 2.9-.1.1-.3.1-.2-.1.3-.6.9-1.9.6-2.1ZM18.5 6.7V5.8c0-.1.1-.2.2-.2h4.1c.1 0 .2.1.2.2v.8c0 .1-.1.3-.3.5l-2.1 3c.8 0 1.7.1 2.4.5.2.1.2.2.2.4v1c0 .1-.2.3-.3.2-1.3-.7-3-.7-4.4 0-.1.1-.3-.1-.3-.2v-.9c0-.1 0-.3.1-.4l2.5-3.6h-2.2c-.1 0-.2-.1-.2-.2Zm-7.5 5.6H9.8c-.1 0-.2-.1-.2-.2V5.8c0-.1.1-.2.2-.2H11c.1 0 .2.1.2.2v.8h0c.3-.8 1-.9 1.8-.9.8 0 1.4.1 1.8.9.3-.8 1.1-.9 1.8-.9 1.2 0 2.1.8 2.1 2.4v4c0 .1-.1.2-.2.2h-1.2c-.1 0-.2-.1-.2-.2V8.7c0-.3 0-1-.1-1.3-.1-.4-.4-.5-.8-.5-.3 0-.7.2-.8.5-.2.4-.2 1-.2 1.3v3.4c0 .1-.1.2-.2.2h-1.2c-.1 0-.2-.1-.2-.2V8.7c0-.7.1-1.8-.9-1.8-1.1 0-1 1.3-1 1.8v3.4c0 .1-.1.2-.2.2Z"/></svg>',
            tiktok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.8 3c.2 1.5 1.1 2.8 2.5 3.4.8.4 1.6.6 2.4.6v2.9a7.2 7.2 0 0 1-3-.7v5.6a5.8 5.8 0 1 1-5.8-5.8c.2 0 .5 0 .7.1v3c-.2-.1-.4-.1-.7-.1a2.8 2.8 0 1 0 2.8 2.8V3h3.1Z"/></svg>'
        };
        return icons[name] || "";
    }

    function renderAnnouncement(announcement) {
        if (!announcement || !announcement.active || !announcement.text) {
            return;
        }

        const header = document.querySelector(".site-header");
        if (!header) {
            return;
        }

        const existing = document.querySelector(".site-announcement");
        if (existing) {
            existing.remove();
        }

        const bar = document.createElement("div");
        bar.className = "site-announcement";
        bar.innerHTML = announcement.link
            ? `<a href="${announcement.link}">${announcement.text}</a>`
            : `<span>${announcement.text}</span>`;

        header.insertAdjacentElement("beforebegin", bar);
    }

    function applyBranding() {
        normalizeDocumentTitle();
        document.querySelectorAll(".brand-copy span").forEach((node) => {
            node.textContent = "Publishing";
        });
        document.querySelectorAll("[data-site-title]").forEach((node) => {
            node.textContent = "Rade & Co Publishing";
        });
    }

    function renderNav() {
        const navLinks = document.getElementById("navLinks");
        if (!navLinks) {
            return;
        }
        const prefix = getPathPrefix();
        const pageKey = getPageKey();
        const links = [
            { key: "home", href: "index.html", label: "Home" },
            { key: "books", href: "books.html", label: "Books" },
            { key: "kids", href: "kids-corner.html", label: "Kids Corner" },
            { key: "blog", href: "blog.html", label: "Blog" },
            { key: "about", href: "about.html", label: "About" },
            { key: "contact", href: "contact-rights.html", label: "Contact" }
        ];

        navLinks.innerHTML = links.map((link) => {
            const href = buildLink(prefix, link.href);
            const activeClass = link.key === pageKey ? " class=\"active\"" : "";
            return `<a${activeClass} href="${href}">${link.label}</a>`;
        }).join("");
    }

    function renderFooter(siteSettings) {
        const footerShell = document.querySelector(".footer-shell");
        const copyright = document.querySelector(".copyright");
        if (!footerShell || !copyright) {
            return;
        }

        const prefix = getPathPrefix();
        const socials = [
            { key: "instagram", url: siteSettings.instagramUrl },
            { key: "facebook", url: siteSettings.facebookUrl },
            { key: "youtube", url: siteSettings.youtubeUrl },
            { key: "amazon", url: siteSettings.amazonAuthorUrl },
            { key: "tiktok", url: siteSettings.tiktokUrl }
        ].filter((entry) => entry.url);

        const pageLinks = [
            { href: buildLink(prefix, "index.html"), label: "Home" },
            { href: buildLink(prefix, "books.html"), label: "Books" },
            { href: buildLink(prefix, "kids-corner.html"), label: "Kids Corner" },
            { href: buildLink(prefix, "blog.html"), label: "Blog" },
            { href: buildLink(prefix, "about.html"), label: "About" },
            { href: buildLink(prefix, "contact-rights.html"), label: "Contact" }
        ];

        footerShell.innerHTML = `
            <div class="footer-col">
                <h4>Rade &amp; Co Publishing</h4>
                <p>Elegant planners, meaningful journals, family-friendly books, and specialty titles designed with warmth and clarity.</p>
                <p data-footer-text>${siteSettings.footerText || "A polished publishing storefront with room to grow."}</p>
            </div>
            <div class="footer-col">
                <h4>Quick Menu</h4>
                ${pageLinks.map((link) => `<a href="${link.href}">${link.label}</a>`).join("")}
            </div>
            <div class="footer-col">
                <h4>Follow</h4>
                <div class="footer-socials">
                    ${socials.map((social) => `<a class="social-pill" href="${social.url}" target="_blank" rel="noopener noreferrer" aria-label="${social.key}">${iconSvg(social.key)}</a>`).join("")}
                </div>
            </div>
            <div class="footer-col">
                <h4>Contact</h4>
                ${siteSettings.contactEmail ? `<a href="mailto:${siteSettings.contactEmail}">${siteSettings.contactEmail}</a>` : "<p>Use the contact page for inquiries.</p>"}
                <a href="${buildLink(prefix, "contact-rights.html")}">Contact</a>
                <a href="${buildLink(prefix, "admin/login.html")}">Admin</a>
            </div>
        `;

        copyright.textContent = "All rights reserved © 2026 Rade & Co Publishing.";
    }

    async function init() {
        try {
            injectSharedStyles();
            applyBranding();
            renderNav();

            const [announcement, settings] = await Promise.all([
                store.getAnnouncement(),
                store.getSiteSettings()
            ]);

            renderAnnouncement(announcement);
            renderFooter(settings || {});
        } catch (error) {
            console.error("Site shell content could not load.", error);
        }
    }

    init();
})();
