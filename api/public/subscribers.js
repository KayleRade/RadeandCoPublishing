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

async function sendSignupNotification(payload) {
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.CONTACT_FROM_EMAIL || process.env.BONUS_FROM_EMAIL;
    const notifyEmail = process.env.SUBSCRIBER_NOTIFY_EMAIL || process.env.CONTACT_TO_EMAIL || "radeandco@gmail.com";

    if (!apiKey || !fromEmail || !notifyEmail) {
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
            to: [notifyEmail],
            subject: "New blog signup",
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #2d2926;">
                    <h2>New subscriber signup</h2>
                    <p><strong>Email:</strong> ${payload.email}</p>
                    <p><strong>Name:</strong> ${payload.name}</p>
                    <p><strong>Source:</strong> ${payload.source || "Website"}</p>
                </div>
            `
        })
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Resend email failed: ${text}`);
    }

    return { delivered: true };
}

function defaultSubscriberName(payload) {
    if (payload.name) {
        return payload.name;
    }

    switch (payload.source) {
        case "Homepage Signup":
            return "Homepage Subscriber";
        case "Blog Signup":
            return "Blog Subscriber";
        case "Homepage Popup":
            return "Popup Subscriber";
        case "Free Bonus":
            return "Bonus Subscriber";
        default:
            return "Subscriber";
    }
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

        if (!payload.email) {
            sendJson(res, 400, {
                error: "missing_fields",
                message: "Email is required."
            });
            return;
        }

        const subscriberName = defaultSubscriberName(payload);

        await createRecord(config.subscribersTable, {
            Name: subscriberName,
            Email: payload.email,
            "Book Slug": payload.bookSlug || "",
            "Bonus Title": payload.bonusTitle || "",
            "Bonus URL": payload.bonusUrl || "",
            Source: payload.source || "Website",
            "Subscribe Date": new Date().toISOString()
        });

        let emailDelivered = false;
        let emailError = "";
        if (payload.bonusUrl) {
            try {
                const emailResult = await sendResendEmail({
                    to: payload.email,
                    subject: payload.bonusTitle ? `Your ${payload.bonusTitle}` : "Your free bonus",
                    html: `
                        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #2d2926;">
                            <h2>Your free bonus is ready</h2>
                            <p>Hi ${subscriberName},</p>
                            <p>Thank you for visiting Rade &amp; Co Publishing.</p>
                            <p><a href="${payload.bonusUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#2d2926;color:#ffffff;text-decoration:none;">Download your free bonus</a></p>
                        </div>
                    `
                });
                emailDelivered = emailResult.delivered;
            } catch (error) {
                emailError = error.message || "Bonus email could not be sent.";
            }
        }

        let notificationDelivered = false;
        let notificationError = "";
        if (!payload.bonusUrl) {
            try {
                const notifyResult = await sendSignupNotification({
                    email: payload.email,
                    name: subscriberName,
                    source: payload.source || "Website"
                });
                notificationDelivered = notifyResult.delivered;
            } catch (error) {
                notificationError = error.message || "Signup notification could not be sent.";
            }
        }

        sendJson(res, 200, {
            success: true,
            emailDelivered,
            notificationDelivered,
            emailError,
            notificationError
        });
    } catch (error) {
        sendJson(res, 500, {
            error: "subscriber_flow_failed",
            message: error.message
        });
    }
};
