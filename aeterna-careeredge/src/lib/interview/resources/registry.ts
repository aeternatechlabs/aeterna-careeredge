// src/lib/interview/resources/registry.ts
// Code-Based, Version-Controlled Curated Resource Registry (Phase 4B — Code-Only)
// Zero DB writes. Covers all 17 CareerEdge AcademicDomains with authoritative official/OER sources.
// Note: lastVerifiedAt is null until live verification is executed; access labels are conservative.

import { ACADEMIC_DOMAINS, type AcademicDomain } from "@/lib/constants/domains";
import { LEGACY_DOMAIN_MAP } from "@/lib/interview/types";
import type {
  AccessClassification,
  CertificateAvailability,
  LearningResourceEntry,
  ResourceDifficulty,
  ResourceFormat,
} from "./types";
import { validateAndNormalizeUrl } from "./url-safety";

interface CuratedSeedInput {
  id: string;
  title: string;
  provider: string;
  url: string;
  format: ResourceFormat;
  domain: AcademicDomain;
  topicSlugs?: string[];
  subtopics?: string[];
  description: string;
  whyRecommended: string;
  difficulty: ResourceDifficulty;
  language?: string;
  estimatedMinutes?: number | null;
  accessClassification: AccessClassification;
  accessRequirements?: string | null;
  certificateAvailable?: CertificateAvailability;
  license?: string | null;
  attribution?: string | null;
}

function makeCuratedEntry(input: CuratedSeedInput): LearningResourceEntry {
  const checked = validateAndNormalizeUrl(input.url, { requireHttps: true });
  const canonicalUrl = checked.ok ? checked.canonicalUrl : input.url;

  return {
    id: input.id,
    title: input.title,
    provider: input.provider,
    url: canonicalUrl,
    canonicalUrl,
    format: input.format,
    domain: input.domain,
    topicSlugs: input.topicSlugs ?? [],
    subtopics: input.subtopics ?? [],
    description: input.description,
    whyRecommended: input.whyRecommended,
    difficulty: input.difficulty,
    language: input.language || "English",
    estimatedMinutes: input.estimatedMinutes ?? null,
    accessClassification: input.accessClassification,
    accessRequirements: input.accessRequirements ?? null,
    certificateAvailable: input.certificateAvailable ?? "NONE",
    license: input.license ?? null,
    attribution: input.attribution ?? input.provider,
    verificationStatus: "PENDING_REVIEW",
    lastVerifiedAt: null,
    discoverySource: "MANUAL_CURATED",
    reviewStatus: "PUBLISHED",
  };
}

const RAW_CURATED_RESOURCES: CuratedSeedInput[] = [
  // ── 1. Computer Science and IT ──────────────────────────────────────────────
  {
    id: "cs-mdn-http",
    title: "An overview of HTTP",
    provider: "MDN Web Docs",
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview",
    format: "OFFICIAL_DOCS",
    domain: "Computer Science and IT",
    topicSlugs: ["how-the-web-works-http-dns"],
    subtopics: ["Client-server architecture", "HTTP methods", "Status codes"],
    description: "Authoritative guide to HTTP messages, status codes, headers, and client-server communication.",
    whyRecommended: "Primary web standards reference maintained by Mozilla and open web contributors.",
    difficulty: "BEGINNER",
    accessClassification: "COMPLETELY_FREE",
    license: "CC-BY-SA 2.5",
  },
  {
    id: "cs-git-book",
    title: "Pro Git Book (Official Documentation)",
    provider: "Git SCM",
    url: "https://git-scm.com/book/en/v2",
    format: "OFFICIAL_DOCS",
    domain: "Computer Science and IT",
    topicSlugs: ["cli-and-git-workflows"],
    subtopics: ["Git branching", "Merging", "Rebasing"],
    description: "Complete official reference covering Git internals, branching, merging, and workflows.",
    whyRecommended: "Authoritative open-source book recommended for mastering Git beyond basic commands.",
    difficulty: "BEGINNER",
    accessClassification: "COMPLETELY_FREE",
    license: "CC BY-NC-SA 3.0",
  },
  {
    id: "cs-mdn-html-a11y",
    title: "HTML & Accessibility Guides",
    provider: "MDN Web Docs",
    url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Accessibility",
    format: "OFFICIAL_DOCS",
    domain: "Computer Science and IT",
    topicSlugs: ["semantic-html-forms-accessibility"],
    subtopics: ["Semantic HTML", "Keyboard navigation", "ARIA"],
    description: "Structured learning module on semantic HTML, accessible forms, and screen-reader support.",
    whyRecommended: "Covers practical accessibility patterns tested in frontend interviews.",
    difficulty: "BEGINNER",
    accessClassification: "COMPLETELY_FREE",
    license: "CC-BY-SA 2.5",
  },
  {
    id: "cs-webdev-css",
    title: "Learn CSS",
    provider: "web.dev (Google)",
    url: "https://web.dev/learn/css",
    format: "INTERACTIVE",
    domain: "Computer Science and IT",
    topicSlugs: ["css-box-model-flexbox-grid", "responsive-design-and-devtools"],
    subtopics: ["Box model", "Flexbox", "CSS Grid", "Responsive design"],
    description: "Modular CSS course covering box model, Flexbox, Grid, and responsive layouts.",
    whyRecommended: "Clear visual explanations with modern layout examples.",
    difficulty: "BEGINNER",
    accessClassification: "COMPLETELY_FREE",
    license: "CC BY 4.0",
  },
  {
    id: "cs-jsinfo-closures",
    title: "Variable scope, closure & Async JavaScript",
    provider: "JavaScript.info",
    url: "https://javascript.info/closure",
    format: "ARTICLE",
    domain: "Computer Science and IT",
    topicSlugs: ["js-functions-scope-closures", "js-async-promises-fetch"],
    subtopics: ["Lexical environment", "Closures", "Promises"],
    description: "In-depth open tutorial explaining lexical environments, scope chains, and closures.",
    whyRecommended: "Explains exact execution-context mechanics behind closure interview questions.",
    difficulty: "INTERMEDIATE",
    accessClassification: "COMPLETELY_FREE",
  },
  {
    id: "cs-ts-handbook",
    title: "The TypeScript Handbook",
    provider: "TypeScript Official Docs",
    url: "https://www.typescriptlang.org/docs/handbook/intro.html",
    format: "OFFICIAL_DOCS",
    domain: "Computer Science and IT",
    topicSlugs: ["typescript-types-interfaces-generics"],
    subtopics: ["Types & interfaces", "Narrowing", "Generics"],
    description: "Official TypeScript guide to types, narrowing, generics, and strict type checking.",
    whyRecommended: "Authoritative source for TypeScript mental models and utility types.",
    difficulty: "INTERMEDIATE",
    accessClassification: "COMPLETELY_FREE",
  },
  {
    id: "cs-react-docs",
    title: "React Official Documentation (Learn React)",
    provider: "React",
    url: "https://react.dev/learn",
    format: "OFFICIAL_DOCS",
    domain: "Computer Science and IT",
    topicSlugs: ["react-components-state-hooks", "nextjs-routing-and-api-integration"],
    subtopics: ["Components", "State", "Hooks", "Effects"],
    description: "Official interactive React documentation covering state, rendering, and hooks.",
    whyRecommended: "Modern hooks-first official curriculum with interactive sandboxes.",
    difficulty: "INTERMEDIATE",
    accessClassification: "COMPLETELY_FREE",
    license: "CC BY 4.0",
  },
  {
    id: "cs-nextjs-docs",
    title: "Next.js App Router Documentation",
    provider: "Vercel / Next.js",
    url: "https://nextjs.org/docs/app",
    format: "OFFICIAL_DOCS",
    domain: "Computer Science and IT",
    topicSlugs: ["nextjs-routing-and-api-integration", "end-to-end-auth-and-session-flows"],
    subtopics: ["App Router", "Server Components", "Route Handlers"],
    description: "Official documentation for Next.js App Router, server/client boundaries, and routing.",
    whyRecommended: "Essential reference for full-stack React architectures.",
    difficulty: "INTERMEDIATE",
    accessClassification: "COMPLETELY_FREE",
  },
  {
    id: "cs-owasp-api",
    title: "OWASP API Security Top 10",
    provider: "OWASP Foundation",
    url: "https://owasp.org/API-Security/",
    format: "STANDARDS",
    domain: "Computer Science and IT",
    topicSlugs: ["authentication-authorization-security"],
    subtopics: ["Broken object level authorization", "Authentication", "SSRF"],
    description: "Industry-standard security reference detailing common API vulnerabilities and mitigations.",
    whyRecommended: "Directly prepares you for API security and IDOR prevention questions.",
    difficulty: "INTERMEDIATE",
    accessClassification: "COMPLETELY_FREE",
    license: "CC BY-SA 4.0",
  },
  {
    id: "cs-postgres-docs",
    title: "PostgreSQL Official Tutorial & Documentation",
    provider: "PostgreSQL Global Development Group",
    url: "https://www.postgresql.org/docs/current/tutorial.html",
    format: "OFFICIAL_DOCS",
    domain: "Computer Science and IT",
    topicSlugs: ["relational-modeling-and-sql", "indexes-transactions-postgresql-migrations"],
    subtopics: ["SQL queries", "Joins", "Transactions", "Indexes"],
    description: "Official PostgreSQL documentation covering relational queries, joins, and transactions.",
    whyRecommended: "Authoritative reference for PostgreSQL behavior and indexing.",
    difficulty: "INTERMEDIATE",
    accessClassification: "COMPLETELY_FREE",
  },
  {
    id: "cs-fullstackopen",
    title: "Full Stack Open",
    provider: "University of Helsinki",
    url: "https://fullstackopen.com/en/",
    format: "UNIVERSITY_OER",
    domain: "Computer Science and IT",
    topicSlugs: ["nodejs-rest-apis-and-middleware", "unit-integration-and-e2e-testing"],
    subtopics: ["React", "Node.js", "Testing", "TypeScript"],
    description: "Open university course on modern full-stack web development with JavaScript, React, Node, and testing.",
    whyRecommended: "University-grade full-stack curriculum with practical exercises.",
    difficulty: "INTERMEDIATE",
    accessClassification: "COMPLETELY_FREE",
    certificateAvailable: "FREE_CERTIFICATE",
  },
  {
    id: "cs-freecodecamp",
    title: "freeCodeCamp Curriculum",
    provider: "freeCodeCamp",
    url: "https://www.freecodecamp.org/learn",
    format: "FREE_COURSE",
    domain: "Computer Science and IT",
    topicSlugs: ["semantic-html-forms-accessibility", "js-arrays-objects-es-modules"],
    description: "Interactive coding curriculum covering HTML, CSS, JavaScript, APIs, and relational databases.",
    whyRecommended: "Hands-on browser exercises with no paid barrier for core certifications.",
    difficulty: "BEGINNER",
    accessClassification: "FREE_ACCOUNT_REQUIRED",
    accessRequirements: "Free account required to save progress and claim certificates.",
    certificateAvailable: "FREE_CERTIFICATE",
  },
  {
    id: "cs-nodejs-docs",
    title: "Node.js Official Guides & API Docs",
    provider: "OpenJS Foundation",
    url: "https://nodejs.org/en/learn/getting-started/introduction-to-nodejs",
    format: "OFFICIAL_DOCS",
    domain: "Computer Science and IT",
    topicSlugs: ["nodejs-rest-apis-and-middleware"],
    subtopics: ["Event loop", "Streams", "Async patterns", "Modules"],
    description: "Official Node.js learning guides covering the event loop, async I/O, streams, and TypeScript.",
    whyRecommended: "Authoritative backend runtime reference for server-side JavaScript interviews.",
    difficulty: "INTERMEDIATE",
    accessClassification: "COMPLETELY_FREE",
  },
  {
    id: "cs-python-docs",
    title: "The Python Official Tutorial",
    provider: "Python Software Foundation",
    url: "https://docs.python.org/3/tutorial/",
    format: "OFFICIAL_DOCS",
    domain: "Computer Science and IT",
    subtopics: ["Data structures", "Modules", "Standard library", "Exceptions"],
    description: "Official Python 3 tutorial covering core syntax, data structures, modules, and virtual environments.",
    whyRecommended: "Clean, authoritative reference for coding interviews and scripting.",
    difficulty: "BEGINNER",
    accessClassification: "COMPLETELY_FREE",
  },
  {
    id: "cs-cs50-harvard",
    title: "CS50x: Introduction to Computer Science",
    provider: "Harvard University (edX / OpenCourseWare)",
    url: "https://cs50.harvard.edu/x/",
    format: "UNIVERSITY_OER",
    domain: "Computer Science and IT",
    topicSlugs: ["problem-solving-and-debugging"],
    subtopics: ["Algorithms", "Data structures", "C", "Python", "SQL", "Web"],
    description: "Harvard's open-access computer science curriculum covering algorithms, memory, SQL, and web apps.",
    whyRecommended: "Builds strong first-principles CS intuition tested in technical interviews.",
    difficulty: "BEGINNER",
    accessClassification: "COMPLETELY_FREE",
  },
  {
    id: "cs-odin-project",
    title: "The Odin Project — Full Stack Curriculum",
    provider: "The Odin Project",
    url: "https://www.theodinproject.com/paths",
    format: "FREE_COURSE",
    domain: "Computer Science and IT",
    topicSlugs: ["fullstack-capstone-integration"],
    subtopics: ["HTML/CSS", "JavaScript", "React", "Node.js", "Databases"],
    description: "Project-based open-source curriculum taking learners from foundations to full-stack portfolio projects.",
    whyRecommended: "Strong practical project prompts that translate directly into STAR interview stories.",
    difficulty: "BEGINNER",
    accessClassification: "COMPLETELY_FREE",
    license: "MIT",
  },
  {
    id: "cs-system-design-primer",
    title: "The System Design Primer",
    provider: "GitHub Open Source Community",
    url: "https://github.com/donnemartin/system-design-primer",
    format: "OPEN_SOURCE",
    domain: "Computer Science and IT",
    subtopics: ["Caching", "Load balancing", "Sharding", "CAP theorem", "Queues"],
    description: "Open-source guide to designing scalable distributed systems, caching, and database partitioning.",
    whyRecommended: "Widely used reference for system design and architecture interviews.",
    difficulty: "ADVANCED",
    accessClassification: "COMPLETELY_FREE",
    license: "CC BY 4.0",
  },
  {
    id: "cs-docker-docs",
    title: "Docker Get Started Guide",
    provider: "Docker Inc.",
    url: "https://docs.docker.com/get-started/",
    format: "OFFICIAL_DOCS",
    domain: "Computer Science and IT",
    topicSlugs: ["deployment-env-and-observability"],
    subtopics: ["Containers", "Dockerfiles", "Compose", "Networking"],
    description: "Official hands-on guide to containerizing applications, writing Dockerfiles, and multi-container apps.",
    whyRecommended: "Essential DevOps and deployment fluency for backend and full-stack roles.",
    difficulty: "INTERMEDIATE",
    accessClassification: "COMPLETELY_FREE",
  },
  {
    id: "cs-k8s-basics",
    title: "Kubernetes Official Tutorials",
    provider: "Cloud Native Computing Foundation (CNCF)",
    url: "https://kubernetes.io/docs/tutorials/kubernetes-basics/",
    format: "OFFICIAL_DOCS",
    domain: "Computer Science and IT",
    subtopics: ["Pods", "Deployments", "Services", "Scaling"],
    description: "Interactive official walkthrough of Kubernetes clusters, deployments, services, and rolling updates.",
    whyRecommended: "Core cloud-native orchestration concepts for backend, SRE, and DevOps interviews.",
    difficulty: "INTERMEDIATE",
    accessClassification: "COMPLETELY_FREE",
  },
  {
    id: "cs-mit-missing-semester",
    title: "MIT Missing Semester of Your CS Education",
    provider: "MIT CSAIL",
    url: "https://missing.csail.mit.edu/",
    format: "UNIVERSITY_OER",
    domain: "Computer Science and IT",
    topicSlugs: ["cli-and-git-workflows"],
    subtopics: ["Shell scripting", "Vim/editors", "Git", "Debugging", "Profiling"],
    description: "MIT lecture series covering shell tools, Git internals, debugging, profiling, and security.",
    whyRecommended: "Bridges the gap between classroom theory and everyday developer tooling.",
    difficulty: "BEGINNER",
    accessClassification: "COMPLETELY_FREE",
  },
  {
    id: "cs-playwright-docs",
    title: "Playwright Official Testing Docs",
    provider: "Microsoft Playwright",
    url: "https://playwright.dev/docs/intro",
    format: "OFFICIAL_DOCS",
    domain: "Computer Science and IT",
    topicSlugs: ["unit-integration-and-e2e-testing"],
    subtopics: ["End-to-end testing", "Locators", "Assertions", "CI"],
    description: "Official documentation for reliable cross-browser end-to-end testing, assertions, and traces.",
    whyRecommended: "Directly prepares you for QA automation and full-stack testing interviews.",
    difficulty: "INTERMEDIATE",
    accessClassification: "COMPLETELY_FREE",
  },
  {
    id: "cs-google-techdev",
    title: "Google Tech Dev Guide — Data Structures & Algorithms",
    provider: "Google",
    url: "https://techdevguide.withgoogle.com/paths/data-structures-and-algorithms/",
    format: "FREE_COURSE",
    domain: "Computer Science and IT",
    topicSlugs: ["problem-solving-and-debugging"],
    subtopics: ["Arrays", "Hash maps", "Trees", "Graphs", "Dynamic programming"],
    description: "Curated problem sets, explanations, and video walkthroughs for technical coding interviews.",
    whyRecommended: "Structured DSA practice path authored by Google engineers.",
    difficulty: "INTERMEDIATE",
    accessClassification: "COMPLETELY_FREE",
  },
  {
    id: "cs-mslearn-cloud",
    title: "Microsoft Learn — Cloud & Software Training",
    provider: "Microsoft",
    url: "https://learn.microsoft.com/en-us/training/",
    format: "FREE_COURSE",
    domain: "Computer Science and IT",
    topicSlugs: ["deployment-env-and-observability"],
    subtopics: ["Cloud architecture", "CI/CD", "Identity", "Databases"],
    description: "Free role-based learning paths for cloud architecture, DevOps, TypeScript, and security.",
    whyRecommended: "Free interactive modules with clear architecture diagrams.",
    difficulty: "INTERMEDIATE",
    accessClassification: "COMPLETELY_FREE",
  },
  {
    id: "cs-linux-journey",
    title: "Linux Journey — Interactive Linux Guide",
    provider: "Linux Journey",
    url: "https://linuxjourney.com/",
    format: "INTERACTIVE",
    domain: "Computer Science and IT",
    topicSlugs: ["cli-and-git-workflows"],
    subtopics: ["Command line", "Permissions", "Processes", "Networking"],
    description: "Step-by-step interactive lessons on Linux filesystem, permissions, processes, and networking.",
    whyRecommended: "Fast, practical refresher for Linux and systems administration interviews.",
    difficulty: "BEGINNER",
    accessClassification: "COMPLETELY_FREE",
  },

  // ── 2. Engineering and Technology ───────────────────────────────────────────
  {
    id: "eng-nptel",
    title: "NPTEL Engineering Courses Portal",
    provider: "NPTEL (IITs & IISc)",
    url: "https://nptel.ac.in",
    format: "UNIVERSITY_OER",
    domain: "Engineering and Technology",
    description: "Open video lectures and study materials from IITs and IISc across Mechanical, Civil, Electrical, and Electronics.",
    whyRecommended: "Authoritative Indian engineering university curriculum; lectures are free, proctored exam certificates are paid.",
    difficulty: "INTERMEDIATE",
    accessClassification: "FREE_WITH_PAID_CERT",
    accessRequirements: "Course videos are free; optional proctored certification exam has a fee.",
    certificateAvailable: "PAID_CERTIFICATE",
  },
  {
    id: "eng-mit-ocw",
    title: "MIT OpenCourseWare — Engineering",
    provider: "Massachusetts Institute of Technology",
    url: "https://ocw.mit.edu/search/?d=Mechanical%20Engineering",
    format: "UNIVERSITY_OER",
    domain: "Engineering and Technology",
    description: "Open lecture notes, problem sets, and exams for core engineering subjects.",
    whyRecommended: "Open-licensed university materials for deep conceptual mastery.",
    difficulty: "INTERMEDIATE",
    accessClassification: "COMPLETELY_FREE",
    license: "CC BY-NC-SA 4.0",
  },

  // ── 3. Pharmacy, Nursing and Allied Health ──────────────────────────────────
  {
    id: "nur-who-ipc",
    title: "WHO Infection Prevention and Control Guidelines",
    provider: "World Health Organization (WHO)",
    url: "https://www.who.int/teams/integrated-health-services/infection-prevention-control",
    format: "STANDARDS",
    domain: "Pharmacy, Nursing and Allied Health",
    description: "Global clinical guidelines on sterile precautions, hand hygiene, and patient safety.",
    whyRecommended: "Authoritative clinical safety standards frequently evaluated in nursing interviews.",
    difficulty: "INTERMEDIATE",
    accessClassification: "COMPLETELY_FREE",
  },
  {
    id: "nur-openstax-anatomy",
    title: "OpenStax Anatomy and Physiology 2e",
    provider: "OpenStax (Rice University)",
    url: "https://openstax.org/details/books/anatomy-and-physiology-2e",
    format: "UNIVERSITY_OER",
    domain: "Pharmacy, Nursing and Allied Health",
    description: "Peer-reviewed open textbook covering human anatomy and physiology.",
    whyRecommended: "Freely accessible peer-reviewed reference under CC BY 4.0.",
    difficulty: "BEGINNER",
    accessClassification: "COMPLETELY_FREE",
    license: "CC BY 4.0",
  },

  // ── 4. Healthcare and Medical Sciences ──────────────────────────────────────
  {
    id: "med-nhm-guidelines",
    title: "National Health Mission Clinical & Standard Treatment Guidelines",
    provider: "Ministry of Health & Family Welfare (India)",
    url: "https://nhm.gov.in",
    format: "GOVERNMENT_PORTAL",
    domain: "Healthcare and Medical Sciences",
    description: "Official Indian public health protocols, maternal/child care guidelines, and clinical standards.",
    whyRecommended: "Essential Indian healthcare policy and clinical reference.",
    difficulty: "INTERMEDIATE",
    accessClassification: "COMPLETELY_FREE",
  },
  {
    id: "med-icmr",
    title: "ICMR Guidelines & Biomedical Research Resources",
    provider: "Indian Council of Medical Research",
    url: "https://www.icmr.gov.in",
    format: "GOVERNMENT_PORTAL",
    domain: "Healthcare and Medical Sciences",
    description: "Official biomedical ethics guidelines and national clinical standards.",
    whyRecommended: "Authoritative source for medical ethics and clinical research standards in India.",
    difficulty: "INTERMEDIATE",
    accessClassification: "COMPLETELY_FREE",
  },

  // ── 5. Commerce, Accounting and Finance ─────────────────────────────────────
  {
    id: "com-icai-bos",
    title: "ICAI Board of Studies Knowledge Portal",
    provider: "Institute of Chartered Accountants of India (ICAI)",
    url: "https://www.icai.org/post/bos-knowledge-portal",
    format: "STANDARDS",
    domain: "Commerce, Accounting and Finance",
    description: "Official study material, accounting standards, taxation, and auditing guides.",
    whyRecommended: "Authoritative Indian accounting and statutory tax curriculum.",
    difficulty: "INTERMEDIATE",
    accessClassification: "COMPLETELY_FREE",
  },
  {
    id: "com-rbi-fin-ed",
    title: "RBI Financial Education Portal",
    provider: "Reserve Bank of India",
    url: "https://www.rbi.org.in/financialeducation/",
    format: "GOVERNMENT_PORTAL",
    domain: "Commerce, Accounting and Finance",
    description: "Official banking, monetary, and financial literacy materials from India's central bank.",
    whyRecommended: "Reliable foundation for banking and finance interview fundamentals.",
    difficulty: "BEGINNER",
    accessClassification: "COMPLETELY_FREE",
  },

  // ── 6. Business and Management ──────────────────────────────────────────────
  {
    id: "bus-swayam-mgmt",
    title: "SWAYAM Management & Business Studies",
    provider: "Ministry of Education (Government of India)",
    url: "https://swayam.gov.in",
    format: "FREE_COURSE",
    domain: "Business and Management",
    description: "University-taught courses in marketing, operations, strategy, and organizational behavior.",
    whyRecommended: "Free course learning from IIM/IIT faculty; optional proctored certificate has an exam fee.",
    difficulty: "INTERMEDIATE",
    accessClassification: "FREE_WITH_PAID_CERT",
    accessRequirements: "Free to enroll and study; optional exam certification is paid.",
    certificateAvailable: "PAID_CERTIFICATE",
  },
  {
    id: "bus-openstax-principles",
    title: "OpenStax Principles of Management",
    provider: "OpenStax (Rice University)",
    url: "https://openstax.org/details/books/principles-management",
    format: "UNIVERSITY_OER",
    domain: "Business and Management",
    description: "Open textbook covering planning, leadership, organizational structure, and strategy.",
    whyRecommended: "Peer-reviewed open business textbook under CC BY 4.0.",
    difficulty: "BEGINNER",
    accessClassification: "COMPLETELY_FREE",
    license: "CC BY 4.0",
  },

  // ── 7. Law and Legal Studies ────────────────────────────────────────────────
  {
    id: "law-indiacode",
    title: "India Code — Official Repository of Central & State Acts",
    provider: "Legislative Department, Ministry of Law & Justice",
    url: "https://www.indiacode.nic.in",
    format: "GOVERNMENT_PORTAL",
    domain: "Law and Legal Studies",
    description: "Official up-to-date statutory text of Indian Acts including Contract Act, BNS, and Constitutional provisions.",
    whyRecommended: "Primary authoritative legal text for statutory interpretation and moot court prep.",
    difficulty: "INTERMEDIATE",
    accessClassification: "COMPLETELY_FREE",
  },
  {
    id: "law-sci-judgments",
    title: "Supreme Court of India — Judgments & Case Archive",
    provider: "Supreme Court of India",
    url: "https://www.sci.gov.in",
    format: "GOVERNMENT_PORTAL",
    domain: "Law and Legal Studies",
    description: "Official judgment search and landmark decisions of the Supreme Court of India.",
    whyRecommended: "Authoritative source for case law research without paywalls.",
    difficulty: "INTERMEDIATE",
    accessClassification: "COMPLETELY_FREE",
  },

  // ── 8. Education and Teaching ───────────────────────────────────────────────
  {
    id: "edu-ncert-books",
    title: "NCERT Textbooks & Pedagogical Frameworks",
    provider: "NCERT (Government of India)",
    url: "https://ncert.nic.in/textbook.php",
    format: "GOVERNMENT_PORTAL",
    domain: "Education and Teaching",
    description: "Official NCERT school textbooks, curriculum frameworks, and teacher guides.",
    whyRecommended: "Core reference for K-12 subject mastery and lesson planning.",
    difficulty: "BEGINNER",
    accessClassification: "COMPLETELY_FREE",
  },
  {
    id: "edu-diksha",
    title: "DIKSHA — Digital Infrastructure for Knowledge Sharing",
    provider: "Ministry of Education & NCERT",
    url: "https://diksha.gov.in",
    format: "GOVERNMENT_PORTAL",
    domain: "Education and Teaching",
    description: "National platform for teacher training modules, lesson plans, and multilingual school resources.",
    whyRecommended: "Supports English and Indian languages for NEP 2020-aligned pedagogy.",
    difficulty: "BEGINNER",
    accessClassification: "COMPLETELY_FREE",
  },

  // ── 9. Science and Research ─────────────────────────────────────────────────
  {
    id: "sci-doaj",
    title: "Directory of Open Access Journals (DOAJ)",
    provider: "DOAJ",
    url: "https://doaj.org",
    format: "OPEN_SOURCE",
    domain: "Science and Research",
    description: "Curated index of peer-reviewed, open-access scientific and scholarly journals.",
    whyRecommended: "Helps students read verified peer-reviewed literature without paywalls.",
    difficulty: "INTERMEDIATE",
    accessClassification: "COMPLETELY_FREE",
  },
  {
    id: "sci-openalex",
    title: "OpenAlex Open Research Catalog",
    provider: "OurResearch / OpenAlex",
    url: "https://openalex.org",
    format: "OPEN_SOURCE",
    domain: "Science and Research",
    description: "Open catalog of scholarly papers, authors, and open-access research datasets.",
    whyRecommended: "Supports literature review and research methodology preparation.",
    difficulty: "INTERMEDIATE",
    accessClassification: "COMPLETELY_FREE",
    license: "CC0",
  },

  // ── 10. Design, Architecture and Creative Industries ────────────────────────
  {
    id: "des-w3c-wai",
    title: "W3C Web Accessibility Initiative (WAI) Design Principles",
    provider: "W3C",
    url: "https://www.w3.org/WAI/fundamentals/accessibility-intro/",
    format: "STANDARDS",
    domain: "Design, Architecture and Creative Industries",
    description: "International accessibility and inclusive design standards.",
    whyRecommended: "Demonstrates inclusive UX rigor during portfolio and design critiques.",
    difficulty: "BEGINNER",
    accessClassification: "COMPLETELY_FREE",
  },
  {
    id: "des-figma-learn",
    title: "Figma Learn — Design & Prototyping Guides",
    provider: "Figma",
    url: "https://help.figma.com/hc/en-us/categories/360002051613-Get-started",
    format: "OFFICIAL_DOCS",
    domain: "Design, Architecture and Creative Industries",
    description: "Official tutorials on wireframing, design systems, auto-layout, and prototyping.",
    whyRecommended: "Documentation is freely accessible; Figma itself is freemium.",
    difficulty: "BEGINNER",
    accessClassification: "FREEMIUM",
    accessRequirements: "Documentation is free; Figma tool offers free starter & paid tiers.",
  },

  // ── 11. Agriculture and Environmental Sciences ──────────────────────────────
  {
    id: "agr-icar",
    title: "ICAR Agricultural Research & Extension Portal",
    provider: "Indian Council of Agricultural Research",
    url: "https://icar.org.in",
    format: "GOVERNMENT_PORTAL",
    domain: "Agriculture and Environmental Sciences",
    description: "Official Indian agricultural research publications, crop advisories, and extension resources.",
    whyRecommended: "Primary authoritative reference for Agricultural Officer and agronomy interviews.",
    difficulty: "INTERMEDIATE",
    accessClassification: "COMPLETELY_FREE",
  },

  // ── 12. Hospitality, Tourism and Hotel Management ───────────────────────────
  {
    id: "hosp-fssai",
    title: "FSSAI Food Safety & Hygiene Standards",
    provider: "Food Safety and Standards Authority of India",
    url: "https://www.fssai.gov.in",
    format: "GOVERNMENT_PORTAL",
    domain: "Hospitality, Tourism and Hotel Management",
    description: "Official food safety, hygiene, and catering compliance manuals in India.",
    whyRecommended: "Core regulatory knowledge for F&B and hotel operations interviews.",
    difficulty: "BEGINNER",
    accessClassification: "COMPLETELY_FREE",
  },

  // ── 13. Media, Journalism and Communication ─────────────────────────────────
  {
    id: "med-presscouncil",
    title: "Norms of Journalistic Conduct",
    provider: "Press Council of India",
    url: "https://www.presscouncil.nic.in",
    format: "STANDARDS",
    domain: "Media, Journalism and Communication",
    description: "Official ethical guidelines and standards for journalism and media reporting in India.",
    whyRecommended: "Essential for media ethics and editorial judgment questions.",
    difficulty: "BEGINNER",
    accessClassification: "COMPLETELY_FREE",
  },

  // ── 14. Government and Public Services ──────────────────────────────────────
  {
    id: "gov-egyankosh",
    title: "IGNOU eGyanKosh Open Digital Repository",
    provider: "IGNOU (Government of India)",
    url: "https://egyankosh.ac.in",
    format: "UNIVERSITY_OER",
    domain: "Government and Public Services",
    description: "Open repository of self-learning study materials on Indian polity, public administration, and economics.",
    whyRecommended: "Widely trusted free foundation for civil services and public-sector exams.",
    difficulty: "INTERMEDIATE",
    accessClassification: "COMPLETELY_FREE",
  },

  // ── 15. Arts and Humanities ─────────────────────────────────────────────────
  {
    id: "art-epgp",
    title: "e-PG Pathshala — Humanities & Social Sciences",
    provider: "UGC / INFLIBNET (Government of India)",
    url: "https://epgp.inflibnet.ac.in",
    format: "UNIVERSITY_OER",
    domain: "Arts and Humanities",
    description: "Open postgraduate modules across literature, history, sociology, philosophy, and languages.",
    whyRecommended: "Peer-reviewed open academic repository maintained by UGC-INFLIBNET.",
    difficulty: "INTERMEDIATE",
    accessClassification: "COMPLETELY_FREE",
  },

  // ── 16. Vocational and Skill-Based Education ────────────────────────────────
  {
    id: "voc-skillindia",
    title: "Skill India Digital Hub",
    provider: "Ministry of Skill Development & Entrepreneurship",
    url: "https://www.skillindiadigital.gov.in",
    format: "GOVERNMENT_PORTAL",
    domain: "Vocational and Skill-Based Education",
    description: "National portal for vocational skill standards and NSQF-aligned training programs.",
    whyRecommended: "Account may be required for enrollment; access terms vary by course.",
    difficulty: "BEGINNER",
    accessClassification: "UNVERIFIED",
    accessRequirements: "Check individual course terms; free registration may be required.",
  },

  // ── 17. Other / Emerging Fields ─────────────────────────────────────────────
  {
    id: "emg-swayam-nptel",
    title: "SWAYAM National MOOCs Portal",
    provider: "Ministry of Education (Government of India)",
    url: "https://swayam.gov.in/explorer",
    format: "FREE_COURSE",
    domain: "Other / Emerging Fields",
    description: "Interdisciplinary university courses across emerging technology, sustainability, and management.",
    whyRecommended: "Free learning access across interdisciplinary topics; exam certificate optional.",
    difficulty: "BEGINNER",
    accessClassification: "FREE_WITH_PAID_CERT",
    certificateAvailable: "PAID_CERTIFICATE",
  },
];

export const CURATED_RESOURCE_REGISTRY: readonly LearningResourceEntry[] =
  RAW_CURATED_RESOURCES.map(makeCuratedEntry);

export interface ResourceFilterOptions {
  topicSlug?: string;
  format?: ResourceFormat | "ALL";
  access?: AccessClassification | "ALL";
  search?: string;
}

/**
 * Resolve a domain string strictly to a supported AcademicDomain, or null if missing/unknown.
 * Never defaults missing or unknown domains to "Computer Science and IT".
 */
export function resolveSupportedDomain(
  domain: string | null | undefined
): AcademicDomain | null {
  if (typeof domain !== "string") return null;
  const trimmed = domain.trim();
  if (!trimmed) return null;

  if ((ACADEMIC_DOMAINS as readonly string[]).includes(trimmed)) {
    return trimmed as AcademicDomain;
  }

  const legacyMapped = LEGACY_DOMAIN_MAP[trimmed.toUpperCase()];
  if (legacyMapped) return legacyMapped;

  const caseMatch = ACADEMIC_DOMAINS.find(
    (d) => d.toLowerCase() === trimmed.toLowerCase()
  );
  return caseMatch ?? null;
}

/**
 * Return PUBLISHED curated resources strictly matching the requested domain.
 * Returns [] when domain is null, undefined, empty, or unknown (never defaults to CS/IT).
 */
export function getCuratedResourcesForDomain(
  domain: string | null | undefined,
  options: ResourceFilterOptions = {}
): LearningResourceEntry[] {
  const normalizedDomain = resolveSupportedDomain(domain);
  if (!normalizedDomain) return [];

  const query = (options.search || "").trim().toLowerCase();

  return CURATED_RESOURCE_REGISTRY.filter((res) => {
    if (res.reviewStatus !== "PUBLISHED") return false;
    if (res.domain !== normalizedDomain) return false;
    if (options.topicSlug && !res.topicSlugs.includes(options.topicSlug)) return false;
    if (options.format && options.format !== "ALL" && res.format !== options.format) return false;
    if (
      options.access &&
      options.access !== "ALL" &&
      res.accessClassification !== options.access
    ) {
      return false;
    }
    if (query) {
      const hay = [
        res.title,
        res.provider,
        res.description,
        ...res.subtopics,
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });
}

/**
 * Approved hostnames derived from the curated registry for fail-closed verification on Cloudflare Workers.
 */
export function getApprovedVerificationHostnames(): Set<string> {
  const hosts = new Set<string>();
  for (const r of CURATED_RESOURCE_REGISTRY) {
    const check = validateAndNormalizeUrl(r.url, { requireHttps: true });
    if (check.ok) hosts.add(check.hostname);
  }
  return hosts;
}
