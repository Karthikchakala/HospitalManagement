  // import nodemailer from 'nodemailer';

  // const {
  //   SMTP_HOST,
  //   SMTP_PORT,
  //   SMTP_USER,
  //   SMTP_PASS,
  //   MAIL_FROM,
  // } = process.env as Record<string, string | undefined>;

  // if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !MAIL_FROM) {
  //   console.warn('[Mailer] Missing SMTP envs. Emails will fail until configured.');
  // }

  // export const transporter = nodemailer.createTransport({
  //   host: SMTP_HOST,
  //   port: Number(SMTP_PORT || 587),
  //   secure: Number(SMTP_PORT) === 465,
  //   auth: {
  //     user: SMTP_USER,
  //     pass: SMTP_PASS,
  //   },
  // });

  // export async function sendMail(opts: {
  //   to: string;
  //   subject: string;
  //   html: string;
  //   attachments?: Array<{ filename: string; content?: any; path?: string }>;
  // }) {
  //   if (!opts.to) throw new Error('sendMail: to is required');
  //   const info = await transporter.sendMail({
  //     from: MAIL_FROM,
  //     to: opts.to,
  //     subject: opts.subject,
  //     html: opts.html,
  //     attachments: opts.attachments,
  //   });
  //   return info;
  // }

import nodemailer from "nodemailer";
import "dotenv/config"; // ensure env loads

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  MAIL_FROM,
} = process.env as Record<string, string | undefined>;

if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
  console.warn("[Mailer] Missing SMTP env variables. Emails will fail.");
}

export const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT || 587),
  secure: Number(SMTP_PORT) === 465, // only true for port 465
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false, // prevents common Gmail TLS error
  },
});

// Optional: verify SMTP connection when server starts
transporter.verify((err, success) => {
  if (err) {
    console.error("❌ SMTP Connection Failed:", err);
  } else {
    console.log("✅ SMTP Server Ready");
  }
});

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{ filename: string; content?: any; path?: string }>;
}) {
  if (!opts.to) throw new Error("sendMail: 'to' is required");

  try {
    const info = await transporter.sendMail({
      from: MAIL_FROM || SMTP_USER, // MUST match Gmail sender
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      attachments: opts.attachments,
    });

    console.log("📧 Email Sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Email sendMail Error:", error);
    throw error;
  }
}
