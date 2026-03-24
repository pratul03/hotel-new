import nodemailer from "nodemailer";
import { env } from "./environment";

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // STARTTLS
  auth: {
    user: env.GMAIL_USER,
    pass: env.GMAIL_APP_PASSWORD, // Google App Password (16 chars, no spaces)
  },
});

export const verifyMailer = async (): Promise<void> => {
  await transporter.verify();
  console.log("✅ Gmail SMTP connection verified");
};
