// src/lib/storage/provider.ts
// Abstract Storage Provider with Local Private implementation and S3/R2 readiness

import fs from "fs";
import path from "path";
import os from "os";

export interface StorageProvider {
  name: string;
  upload(key: string, buffer: Buffer, mimeType: string): Promise<string>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

/**
 * Local Private Storage Provider
 * Saves files strictly outside of public/ in an isolated directory
 * Accessible only via authenticated server route handlers.
 * Automatically uses os.tmpdir() in serverless environments (Vercel / Lambda).
 */
export class LocalPrivateStorageProvider implements StorageProvider {
  name = "LOCAL_PRIVATE";
  private baseDir: string;

  constructor(customBaseDir?: string) {
    if (customBaseDir) {
      this.baseDir = customBaseDir;
    } else if (process.env.PRIVATE_STORAGE_PATH) {
      this.baseDir = process.env.PRIVATE_STORAGE_PATH;
    } else if (
      process.env.VERCEL ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.LAMBDA_TASK_ROOT ||
      process.env.NODE_ENV === "production"
    ) {
      // In serverless environments (Vercel / AWS Lambda), the deployment bundle is read-only.
      // Writable scratch storage is strictly permitted under os.tmpdir() (/tmp).
      this.baseDir = path.resolve(os.tmpdir(), "careeredge_storage", "private_uploads");
    } else {
      try {
        const defaultDir = path.resolve(process.cwd(), "storage", "private_uploads");
        if (!fs.existsSync(defaultDir)) {
          fs.mkdirSync(defaultDir, { recursive: true });
        }
        this.baseDir = defaultDir;
      } catch {
        this.baseDir = path.resolve(os.tmpdir(), "careeredge_storage", "private_uploads");
      }
    }

    try {
      if (!fs.existsSync(this.baseDir)) {
        fs.mkdirSync(this.baseDir, { recursive: true });
      }
    } catch {
      // Fallback directly to os.tmpdir() if custom path cannot be written
      this.baseDir = path.resolve(os.tmpdir(), "careeredge_private_uploads");
      if (!fs.existsSync(this.baseDir)) {
        fs.mkdirSync(this.baseDir, { recursive: true });
      }
    }
  }

  private resolveSafePath(key: string): string {
    // Prevent directory traversal attacks
    const sanitizedKey = key.replace(/\.\./g, "").replace(/^\/+/, "");
    const fullPath = path.resolve(this.baseDir, sanitizedKey);

    if (!fullPath.startsWith(this.baseDir)) {
      throw new Error("Invalid storage key: directory traversal attempt.");
    }

    return fullPath;
  }

  async upload(key: string, buffer: Buffer, _mimeType: string): Promise<string> {
    const fullPath = this.resolveSafePath(key);
    const parentDir = path.dirname(fullPath);

    try {
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      await fs.promises.writeFile(fullPath, buffer);
    } catch (err) {
      console.warn("[StorageProvider] Write to baseDir failed, attempting fallback to tmp:", err);
      const fallbackPath = path.resolve(os.tmpdir(), "careeredge_private_uploads", path.basename(fullPath));
      const fallbackDir = path.dirname(fallbackPath);
      if (!fs.existsSync(fallbackDir)) {
        fs.mkdirSync(fallbackDir, { recursive: true });
      }
      await fs.promises.writeFile(fallbackPath, buffer);
    }
    return key;
  }

  async download(key: string): Promise<Buffer> {
    const fullPath = this.resolveSafePath(key);

    if (fs.existsSync(fullPath)) {
      return fs.promises.readFile(fullPath);
    }

    // Check fallback in tmp
    const fallbackPath = path.resolve(os.tmpdir(), "careeredge_private_uploads", path.basename(fullPath));
    if (fs.existsSync(fallbackPath)) {
      return fs.promises.readFile(fallbackPath);
    }

    throw new Error(`File not found at storage key: ${key}`);
  }

  async delete(key: string): Promise<void> {
    const fullPath = this.resolveSafePath(key);
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath).catch(() => {});
    }
    const fallbackPath = path.resolve(os.tmpdir(), "careeredge_private_uploads", path.basename(fullPath));
    if (fs.existsSync(fallbackPath)) {
      await fs.promises.unlink(fallbackPath).catch(() => {});
    }
  }

  async exists(key: string): Promise<boolean> {
    const fullPath = this.resolveSafePath(key);
    if (fs.existsSync(fullPath)) return true;
    const fallbackPath = path.resolve(os.tmpdir(), "careeredge_private_uploads", path.basename(fullPath));
    return fs.existsSync(fallbackPath);
  }
}

/**
 * Supabase Storage Provider
 * Uses Supabase Storage REST API to securely store student documents in the cloud.
 * Works natively in serverless environments (Vercel) without local disk dependencies.
 */
export class SupabaseStorageProvider implements StorageProvider {
  name = "SUPABASE";
  private supabaseUrl: string;
  private apiKey: string;
  private bucket: string;
  private fallback: LocalPrivateStorageProvider;
  private bucketEnsured = false;

  constructor() {
    this.fallback = new LocalPrivateStorageProvider();

    this.supabaseUrl = (
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      "https://bifjznuuhigmpayefswf.supabase.co"
    ).replace(/\/$/, "");

    this.apiKey =
      process.env.SUPABASE_SECRET_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_KEY ||
      process.env.SUPABASE_KEY ||
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "";

    this.bucket = process.env.SUPABASE_STORAGE_BUCKET || "documents";

    if (!this.apiKey) {
      console.warn("⚠️ [SUPABASE STORAGE] No Supabase API key (SUPABASE_SECRET_KEY or SUPABASE_KEY) found. Using serverless scratch fallback.");
    }
  }

  private cleanKey(key: string): string {
    return key.replace(/^\/+/, "");
  }

  private async ensureBucket(): Promise<void> {
    if (this.bucketEnsured || !this.apiKey) return;
    try {
      const res = await fetch(`${this.supabaseUrl}/storage/v1/bucket`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          apikey: this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: this.bucket,
          name: this.bucket,
          public: false,
        }),
      });
      this.bucketEnsured = true;
    } catch {
      this.bucketEnsured = true;
    }
  }

  async upload(key: string, buffer: Buffer, mimeType: string): Promise<string> {
    const cleaned = this.cleanKey(key);

    if (this.apiKey) {
      try {
        await this.ensureBucket();
        const url = `${this.supabaseUrl}/storage/v1/object/${this.bucket}/${cleaned}`;

        const res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            apikey: this.apiKey,
            "Content-Type": mimeType || "application/octet-stream",
            "x-upsert": "true",
          },
          body: new Uint8Array(buffer),
        });

        if (res.ok) {
          return cleaned;
        }

        const errText = await res.text().catch(() => "");
        console.warn(`[SUPABASE STORAGE] Cloud upload returned ${res.status}: ${errText}. Falling back to serverless scratch storage.`);
      } catch (err) {
        console.warn("[SUPABASE STORAGE] Cloud upload error, falling back to serverless scratch storage:", err);
      }
    }

    // Serverless scratch storage fallback
    return await this.fallback.upload(key, buffer, mimeType);
  }

  async download(key: string): Promise<Buffer> {
    const cleaned = this.cleanKey(key);

    if (this.apiKey) {
      try {
        let url = `${this.supabaseUrl}/storage/v1/object/authenticated/${this.bucket}/${cleaned}`;
        let res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            apikey: this.apiKey,
          },
        });

        if (!res.ok) {
          url = `${this.supabaseUrl}/storage/v1/object/${this.bucket}/${cleaned}`;
          res = await fetch(url, {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              apikey: this.apiKey,
            },
          });
        }

        if (res.ok) {
          const arrayBuffer = await res.arrayBuffer();
          return Buffer.from(arrayBuffer);
        }
      } catch (err) {
        console.warn("[SUPABASE STORAGE] Cloud download failed, checking scratch storage:", err);
      }
    }

    // Fallback to local / serverless scratch
    return await this.fallback.download(key);
  }

  async delete(key: string): Promise<void> {
    const cleaned = this.cleanKey(key);

    if (this.apiKey) {
      try {
        const url = `${this.supabaseUrl}/storage/v1/object/${this.bucket}`;
        await fetch(url, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            apikey: this.apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prefixes: [cleaned] }),
        });
      } catch {}
    }

    await this.fallback.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const cleaned = this.cleanKey(key);

    if (this.apiKey) {
      try {
        const url = `${this.supabaseUrl}/storage/v1/object/info/${this.bucket}/${cleaned}`;
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            apikey: this.apiKey,
          },
        });
        if (res.ok) return true;
      } catch {}
    }

    return await this.fallback.exists(key);
  }
}

/**
 * Production S3/R2 Storage Provider Placeholder
 * Easily plugged in with AWS SDK / @aws-sdk/client-s3 once cloud credentials are provided.
 */
export class S3StorageProvider implements StorageProvider {
  name = "S3";
  private bucket: string;

  constructor() {
    this.bucket = process.env.AWS_S3_BUCKET || "";
    if (!this.bucket) {
      throw new Error("AWS_S3_BUCKET environment variable is missing.");
    }
  }

  async upload(_key: string, _buffer: Buffer, _mimeType: string): Promise<string> {
    throw new Error("S3 provider is waiting for AWS credentials from operations team.");
  }

  async download(_key: string): Promise<Buffer> {
    throw new Error("S3 provider is waiting for AWS credentials from operations team.");
  }

  async delete(_key: string): Promise<void> {
    throw new Error("S3 provider is waiting for AWS credentials from operations team.");
  }

  async exists(_key: string): Promise<boolean> {
    throw new Error("S3 provider is waiting for AWS credentials from operations team.");
  }
}

let activeStorageProvider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (activeStorageProvider) {
    return activeStorageProvider;
  }

  const configuredProvider = process.env.STORAGE_PROVIDER?.toLowerCase();

  // 1. Supabase Storage (Preferred if configured or if key is provided or in Vercel environment)
  if (
    configuredProvider === "supabase" ||
    Boolean(process.env.SUPABASE_SECRET_KEY) ||
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) ||
    Boolean(process.env.SUPABASE_KEY) ||
    Boolean(process.env.SUPABASE_PUBLISHABLE_KEY) ||
    Boolean(process.env.SUPABASE_ANON_KEY) ||
    Boolean(process.env.VERCEL)
  ) {
    try {
      activeStorageProvider = new SupabaseStorageProvider();
      return activeStorageProvider;
    } catch (err) {
      console.warn("⚠️ [STORAGE] Failed to initialize Supabase provider, falling back to LocalPrivateStorageProvider.", err);
    }
  }

  // 2. S3 Provider
  if (configuredProvider === "s3" && process.env.AWS_S3_BUCKET) {
    try {
      activeStorageProvider = new S3StorageProvider();
      return activeStorageProvider;
    } catch {
      console.warn("⚠️ [STORAGE] Failed to initialize S3 provider, falling back to LocalPrivateStorageProvider.");
    }
  }

  // 3. Local / Serverless tmp Fallback
  activeStorageProvider = new LocalPrivateStorageProvider();
  return activeStorageProvider;
}
