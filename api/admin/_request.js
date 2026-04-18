async function parseBody(req) {
    if (req.body && typeof req.body === "object") {
        return req.body;
    }

    const chunks = [];
    for await (const chunk of req) {
        chunks.push(Buffer.from(chunk));
    }

    if (!chunks.length) {
        return {};
    }

    const raw = Buffer.concat(chunks).toString("utf8");
    if (!raw) {
        return {};
    }

    return JSON.parse(raw);
}

module.exports = {
    parseBody
};
