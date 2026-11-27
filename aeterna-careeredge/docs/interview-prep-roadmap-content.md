# CareerEdge Interview Prep 2.0 — Phase 3 Roadmap Content & Engine

**Date:** 2026-11-26  
**Template Implemented:** Full-Stack Developer (`slug: "full-stack-developer"`, `v1`, `PUBLISHED`)

---

## 1. Full-Stack Developer Template Summary

- **10 Phases**, **23 Topics**, **10 Practical Exercises**, with DAG-verified prerequisite links:
  1. **Phase 1 — Programming & Web Foundations** (3 topics, 1 exercise)
  2. **Phase 2 — HTML & CSS** (3 topics, 1 exercise)
  3. **Phase 3 — JavaScript** (4 topics, 1 exercise)
  4. **Phase 4 — TypeScript & Frontend Development** (3 topics, 1 exercise)
  5. **Phase 5 — Backend Development** (2 topics, 1 exercise)
  6. **Phase 6 — Databases** (2 topics, 1 exercise)
  7. **Phase 7 — Full-Stack Integration** (2 topics, 1 exercise)
  8. **Phase 8 — Testing & Quality** (1 topic, 1 exercise)
  9. **Phase 9 — Deployment & DevOps Foundations** (1 topic, 1 exercise)
  10. **Phase 10 — Projects & Interview Preparation** (3 topics, 1 exercise)

Every topic includes non-empty `overview`, `whyItMatters`, `subtopics`, `learningOutcomes`, `completionCriteria`, `practicePrompts`, `difficulty`, `priority`, and `estimatedMinutes`.

---

## 2. Multi-Domain Safeguard
Non-IT kits (e.g., Nursing, Law, Teaching, Commerce) are **not** forced onto the Full-Stack Developer roadmap. `getKitRoadmapView` returns `available: false` with an honest domain notice until their domain template is published in Phase 10, while keeping their intake preferences and Proof Bank questions active.

---

## 3. Integrity & Security Guards
- **DAG Cycle Check**: `wouldCreatePrerequisiteCycle()` in `src/lib/interview/roadmap-engine.ts` blocks self-loops and transitive cycles before inserting `RoadmapPrerequisite` edges.
- **`evidenceItemId` Ownership Check**: `requireOwnedEvidenceItem()` in `src/lib/interview/ownership.ts` blocks cross-user Evidence Vault linking on `PracticeSubmission` (`403`).
- **Kit Ownership**: All roadmap and exercise routes enforce `getSession(req)` (`401`) and `requireOwnedKit(kitId, userId)` (`404`).
