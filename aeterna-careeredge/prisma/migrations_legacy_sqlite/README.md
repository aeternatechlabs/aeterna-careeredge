# Legacy SQLite & Pre-Baseline Migrations Archive

This directory preserves historical migration metadata from before the PostgreSQL baseline reconciliation:

1. **`20261116084743_init`** (tracked in Git) — Original SQLite schema initialization (`DATETIME`, SQLite DDL).
2. **`20261116095012_expand_careeredge_architecture`** (tracked in Git) — SQLite CareerEdge schema expansion.
3. **`20261116120655_multi_domain_passport_foundation`** (tracked in Git) — SQLite Career Passport multi-domain tables.
4. **`20261116123112_add_password_reset_tokens`** (tracked in Git) — SQLite password reset tokens.
5. **`20261126120000_expand_interview_prep_kit_intake`** (untracked locally) — Standalone Phase 1 Interview Prep Kit intake expansion (`ALTER TABLE "interview_prep_kits"`). Its 16 columns are already applied to the live PostgreSQL schema and fully incorporated into `prisma/migrations/00000000000000_postgres_baseline/migration.sql`.

`migration_lock.toml` in this directory preserves the original `provider = "sqlite"` lock file.
