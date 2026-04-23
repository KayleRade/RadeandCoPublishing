const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const dataDir = path.join(__dirname, "..", "..", "data");
const analyticsPath = path.join(dataDir, "analytics.json");

function ensureStorage() {
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    if (!fs.existsSync(analyticsPath)) {
        fs.writeFileSync(analyticsPath, JSON.stringify({
            totalViews: 0,
            pages: {},
            dailyViews: {},
            uniqueVisitors: {}
        }, null, 2));
    }
}

function loadAnalytics() {
    ensureStorage();
    try {
        return JSON.parse(fs.readFileSync(analyticsPath, "utf8"));
    } catch (error) {
        return {
            totalViews: 0,
            pages: {},
            dailyViews: {},
            uniqueVisitors: {}
        };
    }
}

function saveAnalytics(data) {
    ensureStorage();
    fs.writeFileSync(analyticsPath, JSON.stringify(data, null, 2));
}

function normalizePath(input) {
    const raw = String(input || "/").trim() || "/";
    const base = raw.split("?")[0] || "/";
    return base.startsWith("/") ? base : `/${base}`;
}

function normalizeTitle(input, pathname) {
    return String(input || "").trim() || pathname;
}

function todayKey() {
    return new Date().toISOString().slice(0, 10);
}

function hashVisitorId(visitorId) {
    const salt = process.env.ANALYTICS_SALT || "radeco-analytics-salt";
    return crypto
        .createHash("sha256")
        .update(`${salt}:${visitorId}`)
        .digest("hex");
}

function recordPageView({ path: pathname, title, visitorId }) {
    const data = loadAnalytics();
    const safePath = normalizePath(pathname);
    const safeTitle = normalizeTitle(title, safePath);
    const day = todayKey();
    const visitorHash = hashVisitorId(visitorId || "anonymous");

    if (!data.pages[safePath]) {
        data.pages[safePath] = {
            path: safePath,
            title: safeTitle,
            views: 0,
            dailyViews: {},
            uniqueVisitors: {}
        };
    }

    const page = data.pages[safePath];
    page.title = safeTitle;
    page.views += 1;
    page.dailyViews[day] = (page.dailyViews[day] || 0) + 1;
    page.uniqueVisitors[visitorHash] = true;

    data.totalViews += 1;
    data.dailyViews[day] = (data.dailyViews[day] || 0) + 1;
    data.uniqueVisitors[visitorHash] = true;

    saveAnalytics(data);
}

function summarizePage(page) {
    return {
        path: page.path,
        title: page.title,
        views: page.views || 0,
        uniqueVisitors: Object.keys(page.uniqueVisitors || {}).length,
        last7DaysViews: Object.entries(page.dailyViews || {})
            .filter(([day]) => {
                const cutoff = new Date();
                cutoff.setDate(cutoff.getDate() - 6);
                return new Date(day) >= new Date(cutoff.toISOString().slice(0, 10));
            })
            .reduce((sum, [, count]) => sum + count, 0)
    };
}

function getAnalyticsSummary() {
    const data = loadAnalytics();
    const pages = Object.values(data.pages || {}).map(summarizePage);
    const sortedPages = pages.sort((a, b) => b.views - a.views || a.path.localeCompare(b.path));

    return {
        totalViews: data.totalViews || 0,
        uniqueVisitors: Object.keys(data.uniqueVisitors || {}).length,
        trackedPages: sortedPages.length,
        topPages: sortedPages.slice(0, 10),
        allPages: sortedPages
    };
}

module.exports = {
    recordPageView,
    getAnalyticsSummary
};
