// src/lib/interview/templates/full-stack-developer.ts
// Complete 10-Phase Full-Stack Developer Roadmap Template (Phase 3)
// Every phase has substantive topics, subtopics, outcomes, criteria, prerequisites, and exercises.

export interface TemplateTopicDef {
  slug: string;
  title: string;
  overview: string;
  whyItMatters: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  priority: "ESSENTIAL" | "RECOMMENDED" | "OPTIONAL";
  estimatedMinutes: number;
  subtopics: string[];
  learningOutcomes: string[];
  completionCriteria: string[];
  practicePrompts: string[];
  prerequisiteSlugs: string[];
}

export interface TemplateExerciseDef {
  topicSlug?: string;
  title: string;
  objective: string;
  skillsPracticed: string[];
  requirements: string[];
  expectedOutput: string;
  checklist: string[];
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  estimatedMinutes: number;
}

export interface TemplatePhaseDef {
  orderIndex: number;
  title: string;
  description: string;
  estimatedHours: number;
  topics: TemplateTopicDef[];
  exercise: TemplateExerciseDef;
}

export const FULL_STACK_ROADMAP_META = {
  slug: "full-stack-developer",
  domain: "Computer Science and IT",
  roleTitle: "Full-Stack Developer",
  description:
    "Structured 10-phase preparation path covering web foundations, frontend, backend, databases, full-stack integration, testing, deployment, and interview readiness.",
  versionNumber: 1,
} as const;

export const FULL_STACK_PHASES: TemplatePhaseDef[] = [
  {
    orderIndex: 1,
    title: "Phase 1 — Programming & Web Foundations",
    description:
      "Understand how browsers, servers, DNS, HTTP/HTTPS, the command line, and Git work together.",
    estimatedHours: 8,
    topics: [
      {
        slug: "how-the-web-works-http-dns",
        title: "How the Web Works, DNS & HTTP/HTTPS",
        overview:
          "Trace the full lifecycle of a browser request from URL entry and DNS lookup to TLS handshake and HTTP response.",
        whyItMatters:
          "Almost every web debugging and backend interview question builds on HTTP methods, status codes, headers, and HTTPS.",
        difficulty: "BEGINNER",
        priority: "ESSENTIAL",
        estimatedMinutes: 60,
        subtopics: [
          "Client-server architecture",
          "DNS resolution & IP addresses",
          "HTTP methods (GET, POST, PUT, PATCH, DELETE)",
          "HTTP status codes (2xx, 3xx, 4xx, 5xx)",
          "HTTPS & TLS handshake basics",
        ],
        learningOutcomes: [
          "Explain what happens when you type a URL in the browser",
          "Choose the right HTTP method and status code for API responses",
          "Explain why HTTPS encrypts data in transit",
        ],
        completionCriteria: [
          "Diagram the request-response cycle without notes",
          "Inspect live HTTP headers and status codes in browser DevTools",
        ],
        practicePrompts: [
          "What is the difference between 401 Unauthorized and 403 Forbidden?",
          "Why does a browser perform a DNS lookup before opening a TCP/TLS connection?",
        ],
        prerequisiteSlugs: [],
      },
      {
        slug: "cli-and-git-workflows",
        title: "Command Line, Git & GitHub Workflows",
        overview:
          "Navigate filesystems via terminal and collaborate safely using Git branching, commits, diffs, and pull requests.",
        whyItMatters:
          "Version control and CLI fluency are daily requirements on every engineering team and internship.",
        difficulty: "BEGINNER",
        priority: "ESSENTIAL",
        estimatedMinutes: 60,
        subtopics: [
          "Shell navigation, pipes, and environment inspection",
          "Git init, status, add, commit, and log",
          "Branching, merging, and resolving merge conflicts",
          "Pull requests and code review etiquette",
        ],
        learningOutcomes: [
          "Create feature branches and open clean pull requests",
          "Resolve a merge conflict without losing teammates' changes",
        ],
        completionCriteria: [
          "Create a branch, make two commits, and merge via PR",
          "Explain git merge vs git rebase at a high level",
        ],
        practicePrompts: [
          "How do you recover or undo a bad commit safely on a shared branch?",
        ],
        prerequisiteSlugs: [],
      },
      {
        slug: "problem-solving-and-debugging",
        title: "Programming Fundamentals & Systematic Debugging",
        overview:
          "Break down problems into small testable steps and isolate bugs using logs, breakpoints, and edge-case checks.",
        whyItMatters:
          "Interviewers evaluate how calmly and systematically you diagnose unfamiliar bugs.",
        difficulty: "BEGINNER",
        priority: "ESSENTIAL",
        estimatedMinutes: 50,
        subtopics: [
          "Variables, control flow, and functions",
          "Reproducing bugs reliably",
          "Reading stack traces and isolating root causes",
        ],
        learningOutcomes: [
          "Read a stack trace to locate the failing file and line",
          "Write minimal reproduction steps for a bug",
        ],
        completionCriteria: [
          "Debug a failing snippet using breakpoints or structured logs",
        ],
        practicePrompts: [
          "Walk through how you isolated a stubborn bug in a project.",
        ],
        prerequisiteSlugs: ["cli-and-git-workflows"],
      },
    ],
    exercise: {
      topicSlug: "how-the-web-works-http-dns",
      title: "Inspect Live Network Requests & Git Branching Practice",
      objective:
        "Use browser DevTools Network tab to document HTTP requests and practice a clean Git feature-branch workflow.",
      skillsPracticed: ["HTTP", "DevTools", "Git", "CLI"],
      requirements: [
        "Inspect 3 requests (HTML, JSON API, static asset) in Chrome DevTools",
        "Record method, status code, and key response headers",
        "Commit your notes on a separate Git branch and merge to main",
      ],
      expectedOutput: "A markdown log of inspected HTTP requests committed via a feature branch.",
      checklist: [
        "Captured status codes and headers",
        "Created and merged a feature branch cleanly",
      ],
      difficulty: "BEGINNER",
      estimatedMinutes: 45,
    },
  },
  {
    orderIndex: 2,
    title: "Phase 2 — HTML & CSS",
    description:
      "Build accessible, semantic, responsive user interfaces with modern CSS layout systems.",
    estimatedHours: 10,
    topics: [
      {
        slug: "semantic-html-forms-accessibility",
        title: "Semantic HTML, Forms & Accessibility Fundamentals",
        overview:
          "Structure pages with semantic landmarks, accessible form labels, keyboard navigation, and ARIA only when needed.",
        whyItMatters:
          "Accessible markup improves SEO, screen-reader usability, and frontend interview evaluations.",
        difficulty: "BEGINNER",
        priority: "ESSENTIAL",
        estimatedMinutes: 60,
        subtopics: [
          "Document structure & landmarks (header, nav, main, footer)",
          "Accessible forms, labels, and native validation",
          "Keyboard focus order & WCAG contrast basics",
        ],
        learningOutcomes: [
          "Build a form navigable entirely via keyboard",
          "Choose semantic elements over generic divs",
        ],
        completionCriteria: [
          "Build a multi-field form with proper labels and validation messages",
        ],
        practicePrompts: [
          "Why is <button> preferred over a clickable <div>?",
        ],
        prerequisiteSlugs: ["how-the-web-works-http-dns"],
      },
      {
        slug: "css-box-model-flexbox-grid",
        title: "CSS Box Model, Flexbox & CSS Grid",
        overview:
          "Master spacing, box-sizing, 1D alignment with Flexbox, and 2D page layouts with CSS Grid.",
        whyItMatters:
          "Layout bugs and responsive alignment are core frontend practical exercises.",
        difficulty: "BEGINNER",
        priority: "ESSENTIAL",
        estimatedMinutes: 75,
        subtopics: [
          "Box model & box-sizing: border-box",
          "Flexbox axes, wrapping, and alignment",
          "CSS Grid tracks, areas, and auto-fit",
        ],
        learningOutcomes: [
          "Implement responsive card grids without horizontal overflow",
          "Explain when to choose Flexbox vs CSS Grid",
        ],
        completionCriteria: [
          "Build a responsive 3-column card layout that stacks cleanly on mobile",
        ],
        practicePrompts: [
          "How does box-sizing: border-box change width calculations?",
        ],
        prerequisiteSlugs: ["semantic-html-forms-accessibility"],
      },
      {
        slug: "responsive-design-and-devtools",
        title: "Responsive Design, Media Queries & Layout Debugging",
        overview:
          "Design mobile-first breakpoints, fluid typography, and debug overflow using browser DevTools.",
        whyItMatters:
          "Modern apps must work seamlessly across 375px phones, tablets, and wide desktops.",
        difficulty: "BEGINNER",
        priority: "ESSENTIAL",
        estimatedMinutes: 50,
        subtopics: [
          "Mobile-first CSS & breakpoints",
          "Viewport meta tag & relative units (rem, %, vw)",
          "Detecting and fixing horizontal overflow",
        ],
        learningOutcomes: [
          "Audit a page at 375px, 768px, and 1280px widths",
        ],
        completionCriteria: [
          "Verify zero horizontal scroll across mobile and desktop viewports",
        ],
        practicePrompts: [
          "What causes horizontal overflow on mobile screens and how do you fix it?",
        ],
        prerequisiteSlugs: ["css-box-model-flexbox-grid"],
      },
    ],
    exercise: {
      topicSlug: "responsive-design-and-devtools",
      title: "Build a Responsive Accessible Profile & Contact Page",
      objective:
        "Create a semantic HTML/CSS profile page with Flexbox/Grid and zero overflow on 375px mobile.",
      skillsPracticed: ["Semantic HTML", "Flexbox", "CSS Grid", "Accessibility"],
      requirements: [
        "Use semantic landmarks and keyboard-accessible navigation",
        "Include a validated contact form with associated <label> tags",
        "Verify clean layout at 375px and 1280px",
      ],
      expectedOutput: "Responsive HTML/CSS page passing keyboard and mobile checks.",
      checklist: [
        "All form inputs have visible labels",
        "Zero horizontal overflow at 375px",
      ],
      difficulty: "BEGINNER",
      estimatedMinutes: 90,
    },
  },
  {
    orderIndex: 3,
    title: "Phase 3 — JavaScript",
    description:
      "Master core JavaScript semantics, closures, DOM events, and asynchronous programming.",
    estimatedHours: 14,
    topics: [
      {
        slug: "js-functions-scope-closures",
        title: "JavaScript Functions, Scope & Closures",
        overview:
          "Understand lexical scope, execution contexts, closures, and how functions retain access to outer variables.",
        whyItMatters:
          "Closures are one of the most frequently asked JavaScript interview topics and power React hooks.",
        difficulty: "INTERMEDIATE",
        priority: "ESSENTIAL",
        estimatedMinutes: 70,
        subtopics: [
          "var vs let vs const & hoisting",
          "Lexical environment & scope chain",
          "Closures in callbacks and private state",
        ],
        learningOutcomes: [
          "Explain lexical scope and closures with a concrete example",
          "Predict output of classic closure-in-loop snippets",
        ],
        completionCriteria: [
          "Write a counter factory using closures",
          "Explain how closures enable data encapsulation",
        ],
        practicePrompts: [
          "What is a closure and where have you used one in real code?",
        ],
        prerequisiteSlugs: ["problem-solving-and-debugging"],
      },
      {
        slug: "js-arrays-objects-es-modules",
        title: "Arrays, Objects, Immutability & ES Modules",
        overview:
          "Transform data cleanly using map/filter/reduce, destructuring, spread syntax, and ES module imports.",
        whyItMatters:
          "State updates in React and API payload transformations rely on immutable array/object operations.",
        difficulty: "BEGINNER",
        priority: "ESSENTIAL",
        estimatedMinutes: 60,
        subtopics: [
          "map, filter, reduce, find, some/every",
          "Destructuring & spread/rest operators",
          "Shallow vs deep copy & ES modules",
        ],
        learningOutcomes: [
          "Transform nested API arrays without mutating original state",
        ],
        completionCriteria: [
          "Implement grouping and filtering utilities without mutating inputs",
        ],
        practicePrompts: [
          "What is the difference between shallow copy and deep copy in JavaScript?",
        ],
        prerequisiteSlugs: ["js-functions-scope-closures"],
      },
      {
        slug: "js-dom-and-events",
        title: "DOM Manipulation & Event Delegation",
        overview:
          "Query and update DOM nodes safely, handle form events, and optimize listeners with event delegation.",
        whyItMatters:
          "Understanding bubbling, capturing, and preventDefault prevents subtle UI bugs.",
        difficulty: "INTERMEDIATE",
        priority: "RECOMMENDED",
        estimatedMinutes: 55,
        subtopics: [
          "Event bubbling & capturing",
          "Event delegation on parent containers",
          "preventDefault vs stopPropagation",
        ],
        learningOutcomes: [
          "Use event delegation for dynamic lists",
        ],
        completionCriteria: [
          "Build a dynamic list with add/remove using a single delegated listener",
        ],
        practicePrompts: [
          "How does event delegation work and why is it useful?",
        ],
        prerequisiteSlugs: ["semantic-html-forms-accessibility", "js-arrays-objects-es-modules"],
      },
      {
        slug: "js-async-promises-fetch",
        title: "Asynchronous JavaScript, Event Loop, Promises & Fetch",
        overview:
          "Master microtasks vs macrotasks, Promise chaining, async/await error handling, and Fetch API requests.",
        whyItMatters:
          "Every full-stack app depends on non-blocking network calls and reliable error handling.",
        difficulty: "INTERMEDIATE",
        priority: "ESSENTIAL",
        estimatedMinutes: 80,
        subtopics: [
          "Call stack, task queue, and microtask queue",
          "Promises, Promise.all, Promise.allSettled",
          "async/await with try/catch and AbortController",
        ],
        learningOutcomes: [
          "Predict execution order of sync code, Promises, and setTimeout",
          "Handle HTTP errors cleanly with fetch (checking res.ok)",
        ],
        completionCriteria: [
          "Fetch data from an API with loading, empty, and error states",
        ],
        practicePrompts: [
          "Why does fetch() not reject on HTTP 404 or 500 responses?",
        ],
        prerequisiteSlugs: ["js-functions-scope-closures"],
      },
    ],
    exercise: {
      topicSlug: "js-async-promises-fetch",
      title: "Interactive Async Task & Search Filter App",
      objective:
        "Build a vanilla JS/TS module that fetches items, filters with debouncing, and handles network errors.",
      skillsPracticed: ["Closures", "Async/Await", "Fetch API", "DOM Events"],
      requirements: [
        "Implement a closure-based debounce helper",
        "Fetch data and handle non-2xx responses gracefully",
        "Render results without mutating the source array",
      ],
      expectedOutput: "Working interactive filter module with clean error states.",
      checklist: [
        "Debounce implemented via closure",
        "Loading and error states handled",
      ],
      difficulty: "INTERMEDIATE",
      estimatedMinutes: 90,
    },
  },
  {
    orderIndex: 4,
    title: "Phase 4 — TypeScript & Frontend Development",
    description:
      "Build type-safe, component-driven React & Next.js user interfaces.",
    estimatedHours: 16,
    topics: [
      {
        slug: "typescript-types-interfaces-generics",
        title: "TypeScript Fundamentals, Interfaces & Generics",
        overview:
          "Eliminate runtime type bugs with strict TypeScript types, union narrowing, and reusable generics.",
        whyItMatters:
          "Strict TypeScript contracts across API and UI prevent entire classes of production errors.",
        difficulty: "INTERMEDIATE",
        priority: "ESSENTIAL",
        estimatedMinutes: 75,
        subtopics: [
          "Primitive, union, and literal types",
          "Type narrowing & discriminated unions",
          "Generics & utility types (Partial, Pick, Omit, Record)",
        ],
        learningOutcomes: [
          "Model API response states with discriminated unions",
          "Write generic helper functions without using any",
        ],
        completionCriteria: [
          "Type an API response handler with strict mode enabled and zero any",
        ],
        practicePrompts: [
          "When would you use unknown instead of any in TypeScript?",
        ],
        prerequisiteSlugs: ["js-arrays-objects-es-modules"],
      },
      {
        slug: "react-components-state-hooks",
        title: "React Components, State, Props & Hooks",
        overview:
          "Build declarative UI with unidirectional data flow, controlled forms, useState, useEffect, and useMemo.",
        whyItMatters:
          "React component architecture and hook lifecycle questions are central to frontend interviews.",
        difficulty: "INTERMEDIATE",
        priority: "ESSENTIAL",
        estimatedMinutes: 90,
        subtopics: [
          "Component composition & prop drilling alternatives",
          "Controlled vs uncontrolled form inputs",
          "useEffect dependencies & cleanup functions",
        ],
        learningOutcomes: [
          "Avoid stale closures and infinite loops in useEffect",
          "Lift state appropriately and keep components focused",
        ],
        completionCriteria: [
          "Build a multi-step form with preserved state and validation",
        ],
        practicePrompts: [
          "Why does React require keys when rendering lists?",
        ],
        prerequisiteSlugs: ["typescript-types-interfaces-generics", "js-async-promises-fetch"],
      },
      {
        slug: "nextjs-routing-and-api-integration",
        title: "App Router, Server vs Client Components & API Integration",
        overview:
          "Understand Next.js App Router layouts, Server Components, client boundaries, and secure API fetching.",
        whyItMatters:
          "Modern full-stack React frameworks blend server rendering with interactive client islands.",
        difficulty: "INTERMEDIATE",
        priority: "ESSENTIAL",
        estimatedMinutes: 80,
        subtopics: [
          "Server Components vs 'use client' boundaries",
          "Dynamic routes & searchParams",
          "Form submissions, optimistic UI & error boundaries",
        ],
        learningOutcomes: [
          "Keep secrets and DB queries on the server while keeping interactive controls in client components",
        ],
        completionCriteria: [
          "Create a dynamic route that loads server data and updates via API",
        ],
        practicePrompts: [
          "What code can run in a Server Component that cannot run in a Client Component?",
        ],
        prerequisiteSlugs: ["react-components-state-hooks"],
      },
    ],
    exercise: {
      topicSlug: "nextjs-routing-and-api-integration",
      title: "Build a Typed Multi-View React Dashboard Panel",
      objective:
        "Create a typed React component suite with search, filter state, and accessible loading/error states.",
      skillsPracticed: ["TypeScript", "React Hooks", "Component Design"],
      requirements: [
        "Zero TypeScript any types",
        "Controlled search and filter controls",
        "Accessible error and empty state views",
      ],
      expectedOutput: "Type-checked React feature module.",
      checklist: [
        "Passes tsc --noEmit",
        "Keyboard accessible filters",
      ],
      difficulty: "INTERMEDIATE",
      estimatedMinutes: 120,
    },
  },
  {
    orderIndex: 5,
    title: "Phase 5 — Backend Development",
    description:
      "Design secure REST APIs with validation, authentication, authorization, and structured error handling.",
    estimatedHours: 14,
    topics: [
      {
        slug: "nodejs-rest-apis-and-middleware",
        title: "Node.js, Server Architecture & REST API Design",
        overview:
          "Structure route handlers, request parsing, middleware pipelines, and consistent JSON responses.",
        whyItMatters:
          "Clean API contracts make frontend integration and testing predictable.",
        difficulty: "INTERMEDIATE",
        priority: "ESSENTIAL",
        estimatedMinutes: 75,
        subtopics: [
          "Resource-oriented REST endpoints",
          "Request validation & sanitization",
          "Structured error responses & status codes",
        ],
        learningOutcomes: [
          "Design idempotent endpoints with clear validation errors",
        ],
        completionCriteria: [
          "Implement CRUD endpoints with input validation and proper HTTP codes",
        ],
        practicePrompts: [
          "What makes an HTTP method idempotent, and why does it matter for retries?",
        ],
        prerequisiteSlugs: ["how-the-web-works-http-dns", "js-async-promises-fetch"],
      },
      {
        slug: "authentication-authorization-security",
        title: "Authentication, Sessions, Authorization & API Security",
        overview:
          "Protect endpoints using hashed passwords, HttpOnly signed sessions/JWTs, ownership checks, and rate limiting.",
        whyItMatters:
          "Broken access control (IDOR) and insecure cookies are top security interview topics.",
        difficulty: "INTERMEDIATE",
        priority: "ESSENTIAL",
        estimatedMinutes: 85,
        subtopics: [
          "Password hashing (bcrypt/argon2) vs encryption",
          "HttpOnly, Secure, SameSite cookies & JWT verification",
          "Authentication (401) vs Authorization / Ownership (403/404)",
          "Rate limiting & CSRF/XSS/SSRF basics",
        ],
        learningOutcomes: [
          "Enforce user ownership on every user-owned resource query",
          "Explain why session tokens belong in HttpOnly cookies rather than localStorage",
        ],
        completionCriteria: [
          "Verify unauthenticated requests return 401 and cross-user requests are rejected",
        ],
        practicePrompts: [
          "How do you prevent Insecure Direct Object Reference (IDOR) bugs?",
        ],
        prerequisiteSlugs: ["nodejs-rest-apis-and-middleware"],
      },
    ],
    exercise: {
      topicSlug: "authentication-authorization-security",
      title: "Implement Ownership-Protected REST API Endpoints",
      objective:
        "Build authenticated create/read/update API endpoints that validate inputs and enforce user ownership.",
      skillsPracticed: ["REST APIs", "Validation", "Authorization"],
      requirements: [
        "Reject unauthenticated calls with 401",
        "Scope all database queries by authenticated userId",
        "Validate lengths and enums before database writes",
      ],
      expectedOutput: "Authenticated API module with validation and ownership checks.",
      checklist: [
        "401 on missing session",
        "Cross-user access blocked",
      ],
      difficulty: "INTERMEDIATE",
      estimatedMinutes: 90,
    },
  },
  {
    orderIndex: 6,
    title: "Phase 6 — Databases",
    description:
      "Model relational data in PostgreSQL, write efficient SQL queries, use indexes, and manage migrations.",
    estimatedHours: 12,
    topics: [
      {
        slug: "relational-modeling-and-sql",
        title: "Relational Modeling, SQL Queries & Joins",
        overview:
          "Design normalized tables with primary/foreign keys and query related records using INNER and LEFT JOINs.",
        whyItMatters:
          "Nearly every full-stack interview tests SQL joins, aggregations, and schema design.",
        difficulty: "INTERMEDIATE",
        priority: "ESSENTIAL",
        estimatedMinutes: 80,
        subtopics: [
          "Primary keys, foreign keys, and 1:N / M:N relationships",
          "SELECT, WHERE, GROUP BY, HAVING, ORDER BY",
          "INNER JOIN vs LEFT JOIN",
        ],
        learningOutcomes: [
          "Normalize repeating attributes into related tables",
          "Write multi-table SQL joins and aggregate counts",
        ],
        completionCriteria: [
          "Design a 3-table schema with foreign keys and cascade rules",
        ],
        practicePrompts: [
          "When does a LEFT JOIN return NULL columns, and how do you filter for unmatched rows?",
        ],
        prerequisiteSlugs: ["nodejs-rest-apis-and-middleware"],
      },
      {
        slug: "indexes-transactions-postgresql-migrations",
        title: "Indexes, Transactions, PostgreSQL & Safe Migrations",
        overview:
          "Speed up queries with indexes, keep multi-step writes atomic with transactions, and evolve schemas safely.",
        whyItMatters:
          "Production outages often stem from missing indexes or unsafe schema migrations.",
        difficulty: "INTERMEDIATE",
        priority: "ESSENTIAL",
        estimatedMinutes: 75,
        subtopics: [
          "B-Tree & composite indexes (trade-offs on writes)",
          "ACID transactions",
          "Additive vs destructive migrations & ORM patterns",
        ],
        learningOutcomes: [
          "Add composite indexes matching common WHERE/ORDER BY queries",
          "Explain ACID properties in plain language",
        ],
        completionCriteria: [
          "Write an additive migration and explain rollback considerations",
        ],
        practicePrompts: [
          "Why shouldn't you index every single column in a table?",
        ],
        prerequisiteSlugs: ["relational-modeling-and-sql"],
      },
    ],
    exercise: {
      topicSlug: "indexes-transactions-postgresql-migrations",
      title: "Design a Normalized PostgreSQL Schema & Join Queries",
      objective:
        "Model users, projects, and tags with foreign keys, unique constraints, and indexes.",
      skillsPracticed: ["PostgreSQL", "Schema Design", "SQL Joins", "Indexing"],
      requirements: [
        "Include 1:N and M:N join table",
        "Add composite index for user-scoped queries",
        "Write 2 join queries without N+1 roundtrips",
      ],
      expectedOutput: "SQL/Prisma schema and verified query plan.",
      checklist: [
        "Foreign keys and ON DELETE rules defined",
        "Unique constraints prevent duplicates",
      ],
      difficulty: "INTERMEDIATE",
      estimatedMinutes: 75,
    },
  },
  {
    orderIndex: 7,
    title: "Phase 7 — Full-Stack Integration",
    description:
      "Connect frontend, backend, sessions, file uploads, and edge-safe error states end to end.",
    estimatedHours: 10,
    topics: [
      {
        slug: "end-to-end-auth-and-session-flows",
        title: "Frontend–Backend Auth, Cookies & Session Refresh",
        overview:
          "Wire login, signup, OAuth callbacks, credentials: include, and middleware route protection cleanly.",
        whyItMatters:
          "Cookie scope, CORS, and redirect race conditions are common real-world full-stack failure points.",
        difficulty: "INTERMEDIATE",
        priority: "ESSENTIAL",
        estimatedMinutes: 70,
        subtopics: [
          "credentials: include on client fetches",
          "Cookie attributes (HttpOnly, SameSite=Lax, Secure)",
          "Middleware/proxy protection & avoiding redirect loops",
        ],
        learningOutcomes: [
          "Trace an authenticated request from browser cookie to database query",
        ],
        completionCriteria: [
          "Verify login -> protected page -> refresh -> logout flow works without stale state",
        ],
        practicePrompts: [
          "Why does SameSite=Lax work for OAuth GET redirects while blocking cross-site POST CSRF?",
        ],
        prerequisiteSlugs: ["authentication-authorization-security", "nextjs-routing-and-api-integration"],
      },
      {
        slug: "file-uploads-and-error-states",
        title: "Private File Uploads, Validation & Graceful Error States",
        overview:
          "Validate MIME types and file sizes server-side, store privately, and surface actionable UI states.",
        whyItMatters:
          "Unvalidated uploads create security risks and poor user experience.",
        difficulty: "INTERMEDIATE",
        priority: "RECOMMENDED",
        estimatedMinutes: 60,
        subtopics: [
          "Server-side MIME & size validation",
          "Signed/authenticated download routes",
          "Loading, empty, partial, and error UI states",
        ],
        learningOutcomes: [
          "Never silently convert server errors into empty states",
        ],
        completionCriteria: [
          "Handle 400, 401, 404, and 500 API responses cleanly in the UI",
        ],
        practicePrompts: [
          "Why must file type and size always be re-validated on the server?",
        ],
        prerequisiteSlugs: ["end-to-end-auth-and-session-flows"],
      },
    ],
    exercise: {
      topicSlug: "end-to-end-auth-and-session-flows",
      title: "End-to-End Authenticated Feature Flow",
      objective:
        "Connect a form UI to an authenticated API route backed by PostgreSQL with clear error feedback.",
      skillsPracticed: ["Full-Stack Integration", "Auth", "Error Handling"],
      requirements: [
        "Include credentials on client fetch",
        "Persist validated data to database",
        "Render clear error banner on non-2xx responses",
      ],
      expectedOutput: "Verified end-to-end form-to-database workflow.",
      checklist: [
        "Persists across page reload",
        "Handles 400 and 401 responses",
      ],
      difficulty: "INTERMEDIATE",
      estimatedMinutes: 90,
    },
  },
  {
    orderIndex: 8,
    title: "Phase 8 — Testing & Quality",
    description:
      "Write unit, API integration, and browser tests while maintaining strict TypeScript and lint quality.",
    estimatedHours: 8,
    topics: [
      {
        slug: "unit-integration-and-e2e-testing",
        title: "Unit, API Integration & End-to-End Browser Testing",
        overview:
          "Test validation rules, ownership protections, and real user flows across desktop and mobile viewports.",
        whyItMatters:
          "Automated tests catch regressions before users do and prove engineering maturity in interviews.",
        difficulty: "INTERMEDIATE",
        priority: "ESSENTIAL",
        estimatedMinutes: 75,
        subtopics: [
          "Unit tests for pure validation & edge cases",
          "API integration tests with isolated test data cleanup",
          "Playwright browser tests & responsive overflow checks",
        ],
        learningOutcomes: [
          "Write deterministic tests that clean up temporary records",
        ],
        completionCriteria: [
          "Run a passing test suite covering positive, negative, and security cases",
        ],
        practicePrompts: [
          "How do you decide what to test with a unit test vs an end-to-end browser test?",
        ],
        prerequisiteSlugs: ["end-to-end-auth-and-session-flows"],
      },
    ],
    exercise: {
      topicSlug: "unit-integration-and-e2e-testing",
      title: "Write Validation, Ownership & Responsive Regression Tests",
      objective:
        "Create an automated test suite covering invalid inputs, cross-user isolation, and mobile layout.",
      skillsPracticed: ["Testing", "Security Verification", "Playwright"],
      requirements: [
        "Assert 401 unauthenticated and 403/404 cross-user rejection",
        "Verify clean teardown of test fixtures",
      ],
      expectedOutput: "Passing automated test script.",
      checklist: [
        "All assertions pass",
        "No leftover test rows in database",
      ],
      difficulty: "INTERMEDIATE",
      estimatedMinutes: 75,
    },
  },
  {
    orderIndex: 9,
    title: "Phase 9 — Deployment & DevOps Foundations",
    description:
      "Ship applications reliably with environment configuration, builds, HTTPS domains, CI/CD, and logging.",
    estimatedHours: 8,
    topics: [
      {
        slug: "env-builds-deployment-and-observability",
        title: "Environment Variables, Builds, Hosting, HTTPS & Logging",
        overview:
          "Separate secrets from client bundles, verify production builds, configure domains/DNS/TLS, and monitor logs.",
        whyItMatters:
          "Many bugs only surface in production edge/serverless runtimes when env vars or builds differ from local dev.",
        difficulty: "INTERMEDIATE",
        priority: "ESSENTIAL",
        estimatedMinutes: 70,
        subtopics: [
          "Public vs server-only environment variables",
          "Production build verification & typechecking",
          "Custom domains, DNS records, and HTTPS",
          "Structured non-PII server logging & CI checks",
        ],
        learningOutcomes: [
          "Diagnose production issues using structured worker logs without leaking secrets",
        ],
        completionCriteria: [
          "Run a clean production build and verify zero leaked client secrets",
        ],
        practicePrompts: [
          "What is the risk of prefixing a secret API key with NEXT_PUBLIC_?",
        ],
        prerequisiteSlugs: ["unit-integration-and-e2e-testing"],
      },
    ],
    exercise: {
      topicSlug: "env-builds-deployment-and-observability",
      title: "Production Readiness & Observability Checklist",
      objective:
        "Audit environment variables, run production build, and verify structured error logging without PII.",
      skillsPracticed: ["Deployment", "Security Hygiene", "Logging"],
      requirements: [
        "Confirm no secrets are exposed in client components",
        "Verify clean TypeScript and production build output",
      ],
      expectedOutput: "Passing production build and environment audit.",
      checklist: [
        "tsc --noEmit passes",
        "npm run build succeeds",
      ],
      difficulty: "INTERMEDIATE",
      estimatedMinutes: 60,
    },
  },
  {
    orderIndex: 10,
    title: "Phase 10 — Projects & Interview Preparation",
    description:
      "Synthesize portfolio architecture, problem-solving, system design basics, and evidence-backed STAR answers.",
    estimatedHours: 12,
    topics: [
      {
        slug: "project-architecture-and-tradeoffs",
        title: "Explaining Project Architecture & Technical Trade-Offs",
        overview:
          "Present your real projects clearly: problem statement, architecture diagram, trade-offs, and measurable outcomes.",
        whyItMatters:
          "Project deep-dives are the highest-leverage part of fresher and experienced full-stack interviews.",
        difficulty: "INTERMEDIATE",
        priority: "ESSENTIAL",
        estimatedMinutes: 60,
        subtopics: [
          "Framing the problem & constraints",
          "Database & API design trade-offs",
          "Citing real Evidence Vault / GitHub artifacts honestly",
        ],
        learningOutcomes: [
          "Present a 3-minute architecture walkthrough of your strongest project",
        ],
        completionCriteria: [
          "Document architecture decisions and one real challenge solved for your main project",
        ],
        practicePrompts: [
          "If you rebuilt your main project today, what architectural choice would you change and why?",
        ],
        prerequisiteSlugs: ["env-builds-deployment-and-observability"],
      },
      {
        slug: "dsa-and-system-design-fundamentals",
        title: "Data Structures, Problem-Solving & System Design Basics",
        overview:
          "Practice core arrays/maps/trees/graphs complexity analysis plus caching, queues, and database scaling basics.",
        whyItMatters:
          "Helps you reason about time/space complexity and bottlenecks under load.",
        difficulty: "ADVANCED",
        priority: "RECOMMENDED",
        estimatedMinutes: 90,
        subtopics: [
          "Time & space complexity (Big-O)",
          "Hash maps, two pointers, sliding window, BFS/DFS",
          "Caching, rate limiting, and pagination basics",
        ],
        learningOutcomes: [
          "Analyze time/space complexity of your solutions",
          "Explain cursor vs offset pagination and basic caching",
        ],
        completionCriteria: [
          "Solve 5 representative problems explaining brute-force vs optimal complexity",
        ],
        practicePrompts: [
          "How would you design a rate limiter or paginated feed for 100k users?",
        ],
        prerequisiteSlugs: ["indexes-transactions-postgresql-migrations"],
      },
      {
        slug: "behavioral-star-and-mock-interviews",
        title: "Behavioral STAR Stories & Mock Interview Practice",
        overview:
          "Prepare authentic Situation-Task-Action-Result stories backed by your real academic, project, or internship evidence.",
        whyItMatters:
          "Strong behavioral clarity distinguishes candidates with similar technical skills.",
        difficulty: "BEGINNER",
        priority: "ESSENTIAL",
        estimatedMinutes: 60,
        subtopics: [
          "STAR method structure",
          "Handling conflict, ambiguity, and mistakes honestly",
          "Asking thoughtful questions to the interviewer",
        ],
        learningOutcomes: [
          "Deliver 3 concise STAR stories grounded in real experiences",
        ],
        completionCriteria: [
          "Outline 3 STAR responses linked to genuine projects or coursework",
        ],
        practicePrompts: [
          "Tell me about a time you received critical feedback and how you responded.",
        ],
        prerequisiteSlugs: ["project-architecture-and-tradeoffs"],
      },
    ],
    exercise: {
      topicSlug: "project-architecture-and-tradeoffs",
      title: "Prepare Your Proof-Backed Capstone Case Study",
      objective:
        "Document one real full-stack project with architecture notes, trade-offs, and 3 STAR talking points.",
      skillsPracticed: ["System Communication", "STAR Method", "Technical Writing"],
      requirements: [
        "Include only real work and verified links",
        "Document at least 2 architectural trade-offs",
        "Link supporting evidence in your Evidence Vault if available",
      ],
      expectedOutput: "Interview-ready project walkthrough brief.",
      checklist: [
        "No fabricated metrics or claims",
        "Covers architecture, challenge, and result",
      ],
      difficulty: "INTERMEDIATE",
      estimatedMinutes: 60,
    },
  },
];
