const { createRecord, getConfig, sendJson } = require("../cms/_airtable");

function readJsonBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on("data", (chunk) => chunks.push(chunk));
        req.on("end", () => {
            try {
                const raw = Buffer.concat(chunks).toString("utf8") || "{}";
                resolve(JSON.parse(raw));
            } catch (error) {
                reject(error);
            }
        });
        req.on("error", reject);
    });
}

async function sendInquiryEmail(payload) {
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.CONTACT_FROM_EMAIL || process.env.BONUS_FROM_EMAIL;
    const toEmail = process.env.CONTACT_TO_EMAIL || "radeandco@gmail.com";

    if (!apiKey || !fromEmail || !toEmail) {
        return { delivered: false, skipped: true };
    }

    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            from: fromEmail,
            to: [toEmail],
            reply_to: payload.email,
            subject: `New ${payload.type} inquiry from ${payload.name}`,
            html: `
                <div style="font-family:Arial,sans-serif;line-height:1.6;color:#2d2926;">
                    <h2>New contact inquiry</h2>
                    <p><strong>Name:</strong> ${payload.name}</p>
                    <p><strong>Email:</strong> ${payload.email}</p>
                    <p><strong>Inquiry Type:</strong> ${payload.type}</p>
                    <p><strong>Message:</strong></p>
                    <div style="padding:14px 16px;border-radius:12px;background:#f7f2ec;border:1px solid #eadfd3;white-space:pre-wrap;">${payload.message}</div>
                </div>
            `
        })
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Resend email failed: ${text}`);
    }

    return { delivered: true, skipped: false };
}

module.exports = async (req, res) => {
    try {
        if (req.method !== "POST") {
            sendJson(res, 405, { error: "method_not_allowed" });
            return;
        }

        const payload = req.body && typeof req.body === "object" ? req.body : await readJsonBody(req);
        const name = String(payload.name || "").trim();
        const email = String(payload.email || "").trim();
        const type = String(payload.type || "").trim();
        const message = String(payload.message || "").trim();

        if (!name || !email || !type || !message) {
            sendJson(res, 400, {
                error: "missing_fields",
                message: "Please complete all fields before sending your inquiry."
            });
            return;
        }

        const config = getConfig();
        await createRecord(config.contactFormTable, {
            Name: name,
            Email: email,
            "Inquiry Type": type,
            Message: message,
            Source: "Website Contact Form",
            Status: "New",
            "Submitted At": new Date().toISOString()
        });

        const emailResult = await sendInquiryEmail({ name, email, type, message });

        sendJson(res, 200, {
            success: true,
            emailDelivered: !!emailResult.delivered,
            message: "Thank you. Your inquiry has been sent."
        });
    } catch (error) {
        sendJson(res, 500, {
            error: "contact_submission_failed",
            message: error.message || "Something went wrong while sending your inquiry."
        });
    }
};
