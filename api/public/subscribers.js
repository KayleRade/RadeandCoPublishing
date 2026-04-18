const { createRecord, getConfig, sendJson } = require("../cms/_airtable");

async function sendResendEmail(payload) {
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.BONUS_FROM_EMAIL;

    if (!apiKey || !fromEmail || !payload.to || !payload.subject || !payload.html) {
        return { delivered: false };
    }

    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            from: fromEmail,
            to: [payload.to],
            subject: payload.subject,
            html: payload.html
        })
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Resend email failed: ${text}`);
    }

    return { delivered: true };
}

module.exports = async (req, res) => {
    try {
        if (req.method !== "POST") {
            sendJson(res, 405, { error: "method_not_allowed" });
            return;
        }

        const config = getConfig();
        const payload = req.body && typeof req.body === "object" ? req.body : JSON.parse(await new Promise((resolve, reject) => {
            const chunks = [];
            req.on("data", (chunk) => chunks.push(chunk));
            req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8") || "{}"));
            req.on("error", reject);
        }));

        if (!payload.name || !payload.email) {
            sendJson(res, 400, {
                error: "missing_fields",
                message: "Name and email are required."
            });
            return;
        }

        await createRecord(config.subscribersTable, {
            Name: payload.name,
            Email: payload.email,
            "Book Slug": payload.bookSlug || "",
            "Bonus Title": payload.bonusTitle || "",
            "Bonus URL": payload.bonusUrl || "",
            Source: payload.source || "Website",
            "Subscribe Date": new Date().toISOString()
        });

        let emailDelivered = false;
        if (payload.bonusUrl) {
            const emailResult = await sendResendEmail({
                to: payload.email,
                subject: payload.bonusTitle ? `Your ${payload.bonusTitle}` : "Your free bonus",
                html: `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #2d2926;">
                        <h2>Your free bonus is ready</h2>
                        <p>Hi ${payload.name},</p>
                        <p>Thank you for visiting Rade &amp; Co Publishing.</p>
                        <p><a href="${payload.bonusUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#2d2926;color:#ffffff;text-decoration:none;">Download your free bonus</a></p>
                    </div>
                `
            });
            emailDelivered = emailResult.delivered;
        }

        sendJson(res, 200, {
            success: true,
            emailDelivered
        });
    } catch (error) {
        sendJson(res, 500, {
            error: "subscriber_flow_failed",
            message: error.message
        });
    }
};
