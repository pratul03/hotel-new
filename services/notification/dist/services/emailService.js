"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const mailer_1 = require("../config/mailer");
const environment_1 = require("../config/environment");
const sendEmail = async (options) => {
    try {
        await mailer_1.transporter.sendMail({
            from: `"${environment_1.env.FROM_EMAIL_NAME}" <${environment_1.env.GMAIL_USER}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
        });
        console.log(`[Email] ✅ Sent "${options.subject}" → ${options.to}`);
        return true;
    }
    catch (err) {
        console.error(`[Email] ❌ Failed to send "${options.subject}" → ${options.to}:`, err);
        return false;
    }
};
exports.sendEmail = sendEmail;
