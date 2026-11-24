// src/lib/auth/password-reset.ts
// Secure password reset implementation with development delivery and production readiness

import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email/client";

const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export interface CreateResetTokenResult {
  success: boolean;
  message: string;
  devToken?: string;
  devResetUrl?: string;
}

export interface VerifyTokenResult {
  valid: boolean;
  error?: string;
  userId?: string;
  userEmail?: string;
}

/**
 * Creates a cryptographically secure random token, stores its SHA-256 hash in the database,
 * and delivers the reset link.
 *
 * Prevents account enumeration: always returns success regardless of whether the email exists.
 */
export async function createPasswordResetToken(
  email: string,
  origin = "http://localhost:3000"
): Promise<CreateResetTokenResult> {
  const normalizedEmail = email.trim().toLowerCase();

  // Find user without revealing existence
  const user = await db.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, email: true, name: true },
  });

  const genericSuccessMessage =
    "If an account is associated with this email, a password reset link has been dispatched.";

  if (!user) {
    // Return generic success to prevent account enumeration
    return {
      success: true,
      message: genericSuccessMessage,
    };
  }

  // Generate 256-bit cryptographically secure random token
  const rawToken = crypto.randomBytes(32).toString("hex");

  // Store only the SHA-256 hash in the database (never store plaintext tokens)
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);

  // Invalidate any existing unused reset tokens for this user
  await db.passwordResetToken.deleteMany({
    where: { userId: user.id, usedAt: null },
  });

  // Persist the token hash
  await db.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  const resetUrl = `${origin}/reset-password?token=${rawToken}`;

  // Dispatch password reset email via Resend (or logs in dev if key not yet set)
  await sendPasswordResetEmail({
    toEmail: user.email,
    studentName: user.name,
    resetUrl,
  });

  const isDev = process.env.NODE_ENV !== "production";

  if (isDev) {
    console.log("\n==================================================");
    console.log("🔐 [DEV EMAIL DELIVERY] PASSWORD RESET REQUESTED");
    console.log(`👤 Recipient: ${user.name} <${user.email}>`);
    console.log(`🔗 Reset Link: ${resetUrl}`);
    console.log(`⏱️ Expires in: 60 minutes`);
    console.log("==================================================\n");

    return {
      success: true,
      message: genericSuccessMessage,
      devToken: rawToken,
      devResetUrl: resetUrl,
    };
  }

  // Production response: anti-enumeration, secrets never exposed in body
  return {
    success: true,
    message: genericSuccessMessage,
  };
}

/**
 * Validates a password reset token.
 * Verifies hash match, single-use validity, and expiry.
 */
export async function verifyPasswordResetToken(
  rawToken: string
): Promise<VerifyTokenResult> {
  if (!rawToken || typeof rawToken !== "string" || rawToken.length !== 64) {
    return { valid: false, error: "Invalid password reset link format." };
  }

  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  const record = await db.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true, email: true } } },
  });

  if (!record) {
    return { valid: false, error: "Invalid or nonexistent password reset link." };
  }

  if (record.usedAt !== null) {
    return {
      valid: false,
      error: "This password reset link has already been used. Please request a new one.",
    };
  }

  if (record.expiresAt < new Date()) {
    return {
      valid: false,
      error: "This password reset link has expired. Please request a new one.",
    };
  }

  return {
    valid: true,
    userId: record.userId,
    userEmail: record.user.email,
  };
}

/**
 * Executes the password reset: verifies token, updates user password hash,
 * and marks the token as used (single-use enforcement).
 */
export async function resetPasswordWithToken(
  rawToken: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  if (!newPassword || newPassword.length < 8) {
    return {
      success: false,
      error: "Password must be at least 8 characters long.",
    };
  }

  const verification = await verifyPasswordResetToken(rawToken);

  if (!verification.valid || !verification.userId) {
    return {
      success: false,
      error: verification.error || "Password reset failed.",
    };
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  // Invalidate token and update user password atomically
  await db.$transaction([
    db.user.update({
      where: { id: verification.userId },
      data: { passwordHash: newHash },
    }),
    db.passwordResetToken.update({
      where: { tokenHash },
      data: { usedAt: new Date() },
    }),
  ]);

  return { success: true };
}
