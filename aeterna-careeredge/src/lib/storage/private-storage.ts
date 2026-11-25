// src/lib/storage/private-storage.ts
// Private Object Storage & Authorization Manager
// Ensures student documents are NEVER exposed through public URLs

import { db } from "@/lib/db";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { generateId } from "@/lib/supabase/db-proxy";
import crypto from "crypto";
import { getStorageProvider } from "./provider";

export interface StoredFileMetadata {
  id: string;
  originalFileName: string;
  storageKey: string;
  mimeType: string;
  fileSizeBytes: number;
  category: string;
  userId: string;
}

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
  "application/msword", // doc
  "image/png",
  "image/jpeg",
];

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Validates buffer magic bytes against declared MIME type to prevent file-spoofing attacks.
 */
export function validateBufferMagicBytes(buffer: Buffer, declaredMimeType: string): boolean {
  if (!buffer || buffer.length < 4) return false;

  // PDF: %PDF- (0x25 0x50 0x44 0x46)
  if (declaredMimeType === "application/pdf") {
    return (
      buffer[0] === 0x25 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x44 &&
      buffer[3] === 0x46
    );
  }

  // DOCX / ZIP: PK\x03\x04 or legacy DOC OLE compound
  if (
    declaredMimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    declaredMimeType === "application/msword"
  ) {
    return (
      (buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04) ||
      (buffer[0] === 0xd0 && buffer[1] === 0xcf && buffer[2] === 0x11 && buffer[3] === 0xe0)
    );
  }

  // PNG: 0x89 0x50 0x4E 0x47
  if (declaredMimeType === "image/png") {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  }

  // JPEG: 0xFF 0xD8 0xFF
  if (declaredMimeType === "image/jpeg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  return true;
}

/**
 * Validates ownership before granting access to a stored file.
 * Returns null if the authenticated user does not own the document.
 */
export async function authorizeDocumentAccess(
  documentId: string,
  authenticatedUserId: string
): Promise<StoredFileMetadata | null> {
  const supabase = getSupabaseAdmin();
  let doc: {
    id: string;
    originalFileName: string;
    storageKey: string;
    mimeType: string;
    fileSizeBytes: number;
    category: string;
    userId: string;
  } | null = null;

  if (supabase) {
    const { data } = await supabase
      .from("stored_documents")
      .select("id, originalFileName, storageKey, mimeType, fileSizeBytes, category, userId")
      .eq("id", documentId)
      .maybeSingle();
    doc = data;
  } else {
    doc = await db.storedDocument.findUnique({
      where: { id: documentId },
    });
  }

  if (!doc) {
    return null;
  }

  // Strict ownership check
  if (doc.userId !== authenticatedUserId) {
    console.warn(
      `[SECURITY AUDIT] Unauthorized file access attempt: User ${authenticatedUserId} tried to access Document ${documentId} owned by User ${doc.userId}`
    );
    return null;
  }

  return {
    id: doc.id,
    originalFileName: doc.originalFileName,
    storageKey: doc.storageKey,
    mimeType: doc.mimeType,
    fileSizeBytes: doc.fileSizeBytes,
    category: doc.category,
    userId: doc.userId,
  };
}

/**
 * Generates an opaque, unpredictable storage key for private storage.
 */
export function generatePrivateStorageKey(
  userId: string,
  fileName: string
): string {
  const randomSalt = crypto.randomBytes(16).toString("hex");
  const extension = fileName.includes(".")
    ? fileName.slice(fileName.lastIndexOf("."))
    : "";
  return `private/students/${userId}/${Date.now()}-${randomSalt}${extension}`;
}

/**
 * Saves a student document to private storage and registers it in the database.
 */
export async function storeStudentDocument({
  userId,
  fileName,
  mimeType,
  buffer,
  category = "OTHER",
}: {
  userId: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
  category?: string;
}): Promise<StoredFileMetadata> {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error(
      `Unsupported file type: ${mimeType}. Allowed formats are PDF, DOCX, PNG, and JPG.`
    );
  }

  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `File size (${(buffer.length / (1024 * 1024)).toFixed(2)} MB) exceeds maximum allowed limit of 5 MB.`
    );
  }

  if (!validateBufferMagicBytes(buffer, mimeType)) {
    throw new Error(
      "File header contents do not match the declared file format. Upload rejected."
    );
  }

  const storageKey = generatePrivateStorageKey(userId, fileName);
  const provider = getStorageProvider();

  // Save via active storage provider (outside public/)
  await provider.upload(storageKey, buffer, mimeType);

  const supabase = getSupabaseAdmin();
  let record: {
    id: string;
    originalFileName: string;
    storageKey: string;
    mimeType: string;
    fileSizeBytes: number;
    category: string;
    userId: string;
  };

  if (supabase) {
    const { data, error } = await supabase
      .from("stored_documents")
      .insert({
        id: generateId(),
        userId,
        originalFileName: fileName,
        storageKey,
        mimeType,
        fileSizeBytes: buffer.length,
        category,
        isPrivate: true,
        storageEngine: provider.name,
        updatedAt: new Date().toISOString(),
      })
      .select("id, originalFileName, storageKey, mimeType, fileSizeBytes, category, userId")
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Failed to persist document metadata in database.");
    }
    record = data;
  } else {
    // Register metadata in database
    const dbRecord = await db.storedDocument.create({
      data: {
        userId,
        originalFileName: fileName,
        storageKey,
        mimeType,
        fileSizeBytes: buffer.length,
        category,
        isPrivate: true,
        storageEngine: provider.name,
      },
    });
    record = {
      id: dbRecord.id,
      originalFileName: dbRecord.originalFileName,
      storageKey: dbRecord.storageKey,
      mimeType: dbRecord.mimeType,
      fileSizeBytes: dbRecord.fileSizeBytes,
      category: dbRecord.category,
      userId: dbRecord.userId,
    };
  }

  return {
    id: record.id,
    originalFileName: record.originalFileName,
    storageKey: record.storageKey,
    mimeType: record.mimeType,
    fileSizeBytes: record.fileSizeBytes,
    category: record.category,
    userId: record.userId,
  };
}
