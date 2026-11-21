// src/lib/email/client.ts
// Production Transactional Email Service via Resend
// Handles password reset delivery and landing page lead notifications to the company inbox.

import { Resend } from "resend";

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
  simulated?: boolean;
}

const resendApiKey = (process.env.RESEND_API_KEY || "").trim();
const defaultFrom =
  (process.env.EMAIL_FROM || "").trim() || "Aeterna CareerEdge <onboarding@resend.dev>";
const companyLeadsEmail =
  (process.env.COMPANY_LEADS_EMAIL || "").trim() || "leads@aeterna.education";

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * Sends an email using Resend with graceful fallback in development.
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const { to, subject, html, text, from = defaultFrom, replyTo } = params;

  if (!resend) {
    const isDev = process.env.NODE_ENV !== "production";
    if (isDev) {
      console.log("\n==================================================");
      console.log("📧 [SIMULATED EMAIL DISPATCH - NO RESEND KEY]");
      console.log(`📤 From:    ${from}`);
      console.log(`📥 To:      ${Array.isArray(to) ? to.join(", ") : to}`);
      console.log(`📋 Subject: ${subject}`);
      console.log("--------------------------------------------------");
      console.log(text || html.replace(/<[^>]+>/g, " "));
      console.log("==================================================\n");
      return { success: true, simulated: true };
    }

    console.error("[EmailService] Cannot send email: RESEND_API_KEY is not configured.");
    return { success: false, error: "Email delivery service is not configured on this server." };
  }

  try {
    const response = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, " "),
      replyTo: replyTo,
    });

    if (response.error) {
      console.error("[Resend Error]:", response.error);
      return { success: false, error: response.error.message };
    }

    return { success: true, id: response.data?.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to send email via Resend.";
    console.error("[Resend Exception]:", err);
    return { success: false, error: message };
  }
}

/**
 * Dispatches a password reset email to a student.
 */
export async function sendPasswordResetEmail(params: {
  toEmail: string;
  studentName?: string;
  resetUrl: string;
}): Promise<SendEmailResult> {
  const { toEmail, studentName = "Student", resetUrl } = params;
  const subject = "Reset your Aeterna CareerEdge password";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset your password</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 36px 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .brand { font-size: 20px; font-weight: 700; color: #7f1d1d; margin-bottom: 24px; }
    .button { display: inline-block; background-color: #7f1d1d; color: #ffffff !important; padding: 14px 28px; font-weight: 600; text-decoration: none; border-radius: 10px; margin: 24px 0; }
    .footer { font-size: 13px; color: #64748b; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 20px; }
    .link-alt { word-break: break-all; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="brand">Aeterna CareerEdge</div>
    <h2 style="margin-top: 0; color: #0f172a;">Password Reset Request</h2>
    <p>Hello ${studentName},</p>
    <p>We received a request to reset the password for your Aeterna CareerEdge account.</p>
    <p>Click the button below to choose a new password. This link is valid for <strong>60 minutes</strong> and can only be used once.</p>
    <div style="text-align: center;">
      <a href="${resetUrl}" class="button" target="_blank">Reset Password</a>
    </div>
    <p class="link-alt">If the button doesn't work, copy and paste this URL into your browser:<br><a href="${resetUrl}">${resetUrl}</a></p>
    <div class="footer">
      <p>If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
      <p>© ${new Date().getFullYear()} Aeterna CareerEdge. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({
    to: toEmail,
    subject,
    html,
  });
}

/**
 * Dispatches a formatted notification email to the company inbox when a prospective
 * student submits the landing page lead capture form.
 */
export async function sendLeadNotificationEmail(lead: {
  name: string;
  email: string;
  mobile: string;
  city: string;
  status: string;
  interest: string;
  counsellorConsent?: boolean;
}): Promise<SendEmailResult> {
  const subject = `🎯 New Student Lead: ${lead.name} (${lead.city})`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #0f172a; margin: 0; padding: 24px; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #cbd5e1; padding: 28px 24px; }
    .badge { display: inline-block; background-color: #fef2f2; color: #991b1b; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    td.label { width: 35%; font-weight: 600; color: #475569; }
    td.value { color: #0f172a; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">Landing Page Lead Capture</div>
    <h2 style="margin: 0 0 16px 0;">New Prospective Student Registration</h2>
    <p style="color: #64748b; margin: 0 0 16px 0;">A student has submitted their details on the CareerEdge landing page:</p>
    <table>
      <tr><td class="label">Full Name</td><td class="value"><strong>${lead.name}</strong></td></tr>
      <tr><td class="label">Mobile Number</td><td class="value"><a href="tel:${lead.mobile}">${lead.mobile}</a></td></tr>
      <tr><td class="label">Email Address</td><td class="value"><a href="mailto:${lead.email}">${lead.email}</a></td></tr>
      <tr><td class="label">City / Location</td><td class="value">${lead.city}</td></tr>
      <tr><td class="label">Academic Status</td><td class="value">${lead.status}</td></tr>
      <tr><td class="label">Primary Interest</td><td class="value">${lead.interest}</td></tr>
      <tr><td class="label">Counsellor Consent</td><td class="value">${lead.counsellorConsent ? "✅ Yes (Requested guidance)" : "No"}</td></tr>
      <tr><td class="label">Submitted At</td><td class="value">${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</td></tr>
    </table>
  </div>
</body>
</html>
  `;

  return sendEmail({
    to: companyLeadsEmail,
    subject,
    html,
    replyTo: lead.email,
  });
}
