import dotenv from "dotenv";
dotenv.config({ path: "./.env" }); // Load env from backend/.env

import { transporter } from "./transport";

async function testMailer() {
  console.log("🔍 Testing SMTP Mailer...\n");

  console.log("Loaded SMTP ENV:", {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
  });

  // Check if all envs are present
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error("\n❌ Missing SMTP environment variables. Check your .env file.\n");
    return;
  }

  try {
    console.log("📡 Verifying SMTP connection...");
    await transporter.verify();
    console.log("✔ SMTP Connection Verified Successfully!\n");
  } catch (error: any) {
    console.error("❌ SMTP Verification Failed:");
    console.error(error);
    return;
  }

  try {
    console.log("📨 Sending Test Email...");

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.SMTP_USER, // send email to yourself
      subject: "SMTP Test Email",
      text: "Hello! This is a test email sent using Nodemailer.",
    });

    console.log("✔ Test Email Sent Successfully!");
  } catch (error: any) {
    console.error("❌ Email Sending Failed:");
    console.error(error);
  }
}

testMailer();
