const crypto = require("crypto");
const {
    getConfig,
    fetchAllRecords,
    createRecord,
    updateRecord
} = require("../cms/_airtable");

const SESSION_COOKIE = "rade_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;

function useSecureCookies() {
    return process.env.ADMIN_COOKIE_SECURE !== "false";
}

function requireSessionSecret() {
    const secret = process.env.ADMIN_SESSION_SECRET;
    if (!secret) {
        throw new Error("Missing required environment variable: ADMIN_SESSION_SECRET");
    }
    return secret;
}

function parseCookies(req) {
    const cookieHeader = req.headers.cookie || "";
    return cookieHeader.split(";").reduce((acc, item) => {
        const trimmed = item.trim();
        if (!trimmed) {
            return acc;
        }
        const separatorIndex = trimmed.indexOf("=");
        const key = separatorIndex >= 0 ? trimmed.slice(0, separatorIndex) : trimmed;
        const value = separatorIndex >= 0 ? trimmed.slice(separatorIndex + 1) : "";
        acc[key] = decodeURIComponent(value);
        return acc;
    }, {});
}

function signToken(payload) {
    const secret = requireSessionSecret();
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = crypto
        .createHmac("sha256", secret)
        .update(encodedPayload)
        .digest("base64url");
    return `${encodedPayload}.${signature}`;
}

function verifyToken(token) {
    if (!token || !token.includes(".")) {
        return null;
    }

    const [encodedPayload, signature] = token.split(".");
    const expected = crypto
        .createHmac("sha256", requireSessionSecret())
        .update(encodedPayload)
        .digest("base64url");

    if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
        return null;
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    if (!payload.exp || payload.exp < Date.now()) {
        return null;
    }

    return payload;
}

function setCookie(res, value) {
    const parts = [
        `${SESSION_COOKIE}=${encodeURIComponent(value)}`,
        "Path=/",
        "HttpOnly",
        "SameSite=Strict",
        `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`
    ];
    if (useSecureCookies()) {
        parts.push("Secure");
    }
    res.setHeader("Set-Cookie", parts.join("; "));
}

function clearCookie(res) {
    const parts = [`${SESSION_COOKIE}=`, "Path=/", "HttpOnly", "SameSite=Strict", "Max-Age=0"];
    if (useSecureCookies()) {
        parts.push("Secure");
    }
    res.setHeader("Set-Cookie", parts.join("; "));
}

function hashPassword(password, saltHex) {
    const salt = saltHex ? Buffer.from(saltHex, "hex") : crypto.randomBytes(16);
    const derived = crypto.scryptSync(password, salt, 64);
    return `scrypt:${salt.toString("hex")}:${derived.toString("hex")}`;
}

function verifyPassword(password, storedHash) {
    if (!storedHash || typeof storedHash !== "string") {
        return false;
    }

    const [scheme, saltHex, hashHex] = storedHash.split(":");
    if (scheme !== "scrypt" || !saltHex || !hashHex) {
        return false;
    }

    const derived = crypto.scryptSync(password, Buffer.from(saltHex, "hex"), 64);
    const expected = Buffer.from(hashHex, "hex");
    return derived.length === expected.length && crypto.timingSafeEqual(derived, expected);
}

async function getAdminUsers() {
    const config = getConfig();
    const records = await fetchAllRecords(config.adminUsersTable);
    return records.map((record) => ({
        id: record.id,
        email: (record.fields && record.fields["Email"]) || "",
        passwordHash: (record.fields && record.fields["Password Hash"]) || "",
        name: (record.fields && record.fields["Name"]) || "Admin"
    }));
}

async function getAdminUserByEmail(email) {
    const normalized = (email || "").trim().toLowerCase();
    const users = await getAdminUsers();
    return users.find((entry) => entry.email.trim().toLowerCase() === normalized) || null;
}

async function getAdminUserById(id) {
    const users = await getAdminUsers();
    return users.find((entry) => entry.id === id) || null;
}

async function ensureAuthenticated(req) {
    const cookies = parseCookies(req);
    const payload = verifyToken(cookies[SESSION_COOKIE]);
    if (!payload) {
        const error = new Error("Unauthorized");
        error.statusCode = 401;
        throw error;
    }

    const user = await getAdminUserById(payload.sub);
    if (!user) {
        const error = new Error("Unauthorized");
        error.statusCode = 401;
        throw error;
    }

    return user;
}

async function createAdminUser({ email, password, name }) {
    const config = getConfig();
    const userRecord = await createRecord(config.adminUsersTable, {
        Email: email,
        "Password Hash": hashPassword(password),
        Name: name || "Admin"
    });
    return {
        id: userRecord.id,
        email,
        name: name || "Admin"
    };
}

async function updateAdminCredentials(userId, { email, password, name }) {
    const config = getConfig();
    const fields = {};
    if (email) {
        fields["Email"] = email;
    }
    if (password) {
        fields["Password Hash"] = hashPassword(password);
    }
    if (name) {
        fields["Name"] = name;
    }
    await updateRecord(config.adminUsersTable, userId, fields);
}

function issueSession(res, user) {
    const payload = {
        sub: user.id,
        email: user.email,
        exp: Date.now() + SESSION_TTL_MS
    };
    setCookie(res, signToken(payload));
}

module.exports = {
    SESSION_COOKIE,
    clearCookie,
    createAdminUser,
    ensureAuthenticated,
    getAdminUserByEmail,
    getAdminUsers,
    hashPassword,
    issueSession,
    updateAdminCredentials,
    verifyPassword
};
