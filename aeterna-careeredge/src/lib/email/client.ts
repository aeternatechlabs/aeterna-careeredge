// src/lib/email/client.ts
// Production Transactional Email Service supporting Brevo (Sendinblue) and Resend
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
  provider?: "brevo" | "resend" | "simulated";
  simulated?: boolean;
}

const defaultFrom =
  (process.env.EMAIL_FROM || "").trim() || "Aeterna CareerEdge <noreply@careeredge.aeterna.education>";
const companyLeadsEmail =
  (process.env.COMPANY_LEADS_EMAIL || "").trim() || "leads@aeterna.education";

function parseSender(fromStr: string): { name: string; email: string } {
  const match = fromStr.match(/^(.*?)\s*<(.+?)>$/);
  if (match) {
    return {
      name: match[1].trim().replace(/^["']|["']$/g, "") || "Aeterna CareerEdge",
      email: match[2].trim(),
    };
  }
  return {
    name: "Aeterna CareerEdge",
    email: fromStr.trim(),
  };
}

/**
 * Sends an email using Brevo (formerly Sendinblue) Transactional REST API v3.
 * Official endpoint: https://api.brevo.com/v3/smtp/email
 */
async function sendViaBrevo(
  apiKey: string,
  params: SendEmailParams
): Promise<SendEmailResult> {
  const { to, subject, html, text, from = defaultFrom, replyTo } = params;

  const sender = parseSender(from);
  if (process.env.BREVO_SENDER_EMAIL) {
    sender.email = process.env.BREVO_SENDER_EMAIL.trim();
  }
  if (process.env.BREVO_SENDER_NAME) {
    sender.name = process.env.BREVO_SENDER_NAME.trim();
  }

  const recipients = Array.isArray(to) ? to : [to];
  const toList = recipients.map((r) => {
    const match = r.match(/^(.*?)\s*<(.+?)>$/);
    return match
      ? { name: match[1].trim().replace(/^["']|["']$/g, ""), email: match[2].trim() }
      : { email: r.trim() };
  });

  const payload: Record<string, unknown> = {
    sender,
    to: toList,
    subject,
    htmlContent: html,
    textContent: text || html.replace(/<[^>]+>/g, " "),
  };

  if (replyTo) {
    const parsedReply = parseSender(replyTo);
    payload.replyTo = { email: parsedReply.email, name: parsedReply.name };
  }

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      return {
        success: true,
        id: (data as any)?.messageId || (data as any)?.id,
        provider: "brevo",
      };
    }

    const errorMsg =
      (data as any)?.message ||
      (data as any)?.error ||
      `Brevo API responded with status ${res.status}`;
    console.error("[Brevo Error]:", errorMsg, data);
    return { success: false, error: errorMsg, provider: "brevo" };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to send email via Brevo.";
    console.error("[Brevo Exception]:", err);
    return { success: false, error: message, provider: "brevo" };
  }
}

/**
 * Sends an email using Resend with graceful error handling.
 */
async function sendViaResend(
  apiKey: string,
  params: SendEmailParams
): Promise<SendEmailResult> {
  const { to, subject, html, text, from = defaultFrom, replyTo } = params;

  try {
    const resend = new Resend(apiKey);
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
      return { success: false, error: response.error.message, provider: "resend" };
    }

    return { success: true, id: response.data?.id, provider: "resend" };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to send email via Resend.";
    console.error("[Resend Exception]:", err);
    return { success: false, error: message, provider: "resend" };
  }
}

/**
 * Unified transactional email dispatcher supporting Brevo and Resend with dev fallback.
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const { to, subject, html, text, from = defaultFrom } = params;

  const brevoApiKey = (process.env.BREVO_API_KEY || "").trim();
  const resendApiKey = (process.env.RESEND_API_KEY || "").trim();
  const configuredProvider = (process.env.EMAIL_PROVIDER || "").toLowerCase().trim();

  // 1. If explicitly configured as "brevo" or if BREVO_API_KEY is present
  if (configuredProvider === "brevo" || (brevoApiKey && configuredProvider !== "resend")) {
    if (!brevoApiKey) {
      console.error("[EmailService] BREVO_API_KEY is not configured.");
      return { success: false, error: "Brevo API key is not configured on this server." };
    }
    return await sendViaBrevo(brevoApiKey, params);
  }

  // 2. If RESEND_API_KEY is present
  if (resendApiKey) {
    return await sendViaResend(resendApiKey, params);
  }

  // 3. Fallback in development when no email provider keys are configured
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev) {
    console.log("\n==================================================");
    console.log("📧 [SIMULATED EMAIL DISPATCH - NO EMAIL KEY CONFIGURED]");
    console.log(`📤 From:    ${from}`);
    console.log(`📥 To:      ${Array.isArray(to) ? to.join(", ") : to}`);
    console.log(`📋 Subject: ${subject}`);
    console.log("--------------------------------------------------");
    console.log(text || html.replace(/<[^>]+>/g, " "));
    console.log("==================================================\n");
    return { success: true, simulated: true, provider: "simulated" };
  }

  console.error("[EmailService] Cannot send email: No email provider key (BREVO_API_KEY or RESEND_API_KEY) configured.");
  return { success: false, error: "Email delivery service is not configured on this server." };
}

/**
 * Dispatches an ATS-branded password reset email to a student.
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
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FFF9F7; color: #2B1B1B; margin: 0; padding: 24px; }
    .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #F0DEDA; padding: 36px 32px; box-shadow: 0 4px 18px rgba(76, 37, 37, 0.06); }
    .brand { font-size: 20px; font-weight: 800; color: #7A0F1F; margin-bottom: 24px; letter-spacing: -0.02em; }
    .button { display: inline-block; background-color: #7A0F1F; color: #ffffff !important; padding: 14px 28px; font-weight: 700; text-decoration: none; border-radius: 12px; margin: 24px 0; font-size: 15px; }
    .footer { font-size: 13px; color: #907D79; margin-top: 32px; border-top: 1px solid #F0DEDA; padding-top: 20px; }
    .link-alt { word-break: break-all; font-size: 12px; color: #765653; }
  </style>
</head>
<body>
  <div class="container">
    <div class="brand">Aeterna CareerEdge</div>
    <h2 style="margin-top: 0; color: #2B1B1B;">Password Reset Request</h2>
    <p>Hello ${studentName},</p>
    <p>We received a request to reset the password for your Aeterna CareerEdge student account.</p>
    <p>Click the button below to choose a new password. This link is valid for <strong>60 minutes</strong> and can only be used once.</p>
    <div style="text-align: center;">
      <a href="${resetUrl}" class="button" target="_blank">Reset My Password</a>
    </div>
    <p class="link-alt">If the button doesn't work, copy and paste this URL into your browser:<br><a href="${resetUrl}" style="color: #7A0F1F;">${resetUrl}</a></p>
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
