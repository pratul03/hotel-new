import { transporter } from "../config/mailer";
import { env } from "../config/environment";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    await transporter.sendMail({
      from: `"${env.FROM_EMAIL_NAME}" <${env.GMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    console.log(`[Email] ✅ Sent "${options.subject}" → ${options.to}`);
    return true;
  } catch (err) {
    console.error(
      `[Email] ❌ Failed to send "${options.subject}" → ${options.to}:`,
      err,
    );
    return false;
  }
};
