"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyMailer = exports.transporter = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const environment_1 = require("./environment");
exports.transporter = nodemailer_1.default.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // STARTTLS
    auth: {
        user: environment_1.env.GMAIL_USER,
        pass: environment_1.env.GMAIL_APP_PASSWORD, // Google App Password (16 chars, no spaces)
    },
});
const verifyMailer = async () => {
    await exports.transporter.verify();
    console.log("✅ Gmail SMTP connection verified");
};
exports.verifyMailer = verifyMailer;
