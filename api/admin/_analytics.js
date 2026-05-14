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

function getAvailablePeriods(data) {
    const days = Object.keys(data.dailyViews || {});
    const seen = new Set();
    const periods = [];

    days.forEach((day) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
            return;
        }

        const [year, month] = day.split("-");
        const key = `${year}-${month}`;
        if (seen.has(key)) {
            return;
        }

        seen.add(key);
        periods.push({
            key,
            year,
            month,
            label: new Date(`${key}-01T00:00:00Z`).toLocaleString("en-US", {
                month: "long",
                year: "numeric",
                timeZone: "UTC"
            })
        });
    });

    return periods.sort((a, b) => b.key.localeCompare(a.key));
}

function summarizePage(page, selectedPrefix) {
    const monthViews = Object.entries(page.dailyViews || {})
        .filter(([day]) => day.startsWith(selectedPrefix))
        .reduce((sum, [, count]) => sum + count, 0);

    return {
        path: page.path,
        title: page.title,
        views: monthViews
    };
}

function getAnalyticsSummary(options = {}) {
    const data = loadAnalytics();
    const periods = getAvailablePeriods(data);
    const latestPeriod = periods[0] || null;
    const requestedYear = String(options.year || latestPeriod?.year || new Date().getUTCFullYear());
    const requestedMonth = String(options.month || latestPeriod?.month || String(new Date().getUTCMonth() + 1).padStart(2, "0"));
    const exactPeriod = periods.find((period) => period.year === requestedYear && period.month === requestedMonth);
    const yearFallback = periods.find((period) => period.year === requestedYear);
    const activePeriod = exactPeriod || yearFallback || latestPeriod || {
        year: requestedYear,
        month: requestedMonth
    };
    const selectedYear = activePeriod.year;
    const selectedMonth = activePeriod.month;
    const selectedPrefix = `${selectedYear}-${selectedMonth}`;
    const pages = Object.values(data.pages || {})
        .map((page) => summarizePage(page, selectedPrefix))
        .filter((page) => page.views > 0);
    const sortedPages = pages.sort((a, b) => b.views - a.views || a.path.localeCompare(b.path));

    return {
        selectedYear,
        selectedMonth,
        periods,
        trackedPages: sortedPages.length,
        allPages: sortedPages
    };
}

module.exports = {
    recordPageView,
    getAnalyticsSummary
};
