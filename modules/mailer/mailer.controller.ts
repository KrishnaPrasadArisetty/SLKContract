import { env } from "@/src/utils/env";
import nodemailer from "nodemailer";

export class EmailController {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.smtp.SMTP_HOST,
      port: parseInt(env.smtp.SMTP_PORT!, 10),
      secure: false,

      auth: {
        user: env.smtp.SMTP_EMAIL,
        pass: env.smtp.SMTP_PASSWORD,
      },
    });
  }

  async sendEmail(payload: {
    to: string;
    subject: string;
    html: string;
  }): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: env.smtp.SMTP_EMAIL,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      });

      console.info("Message sent: %s", info);

      return info;
    } catch (error) {
      console.error("Error occurred while sending email:", error);
      return error;
    }
  }
}

export const emailController: EmailController = new EmailController();
