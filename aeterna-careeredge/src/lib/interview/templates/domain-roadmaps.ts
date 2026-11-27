// src/lib/interview/templates/domain-roadmaps.ts
// Multi-Domain Starter Roadmap Pathways across all 17 CareerEdge Academic Domains (Phase 10)
// Honest domain-authentic starter pathways; never fabricates regulatory licenses or reuses CS/IT content for non-IT domains.

import { ACADEMIC_DOMAINS, type AcademicDomain } from "@/lib/constants/domains";

export interface StarterTopicDef {
  slug: string;
  orderIndex: number;
  title: string;
  overview: string;
  whyItMatters: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  estimatedMinutes: number;
  priority: "ESSENTIAL" | "RECOMMENDED" | "OPTIONAL";
  prerequisiteSlugs: string[];
  subtopics: string[];
  learningOutcomes: string[];
  completionCriteria: string[];
  practicePrompts: string[];
}

export interface StarterPhaseDef {
  orderIndex: number;
  title: string;
  description: string;
  estimatedHours: number;
  topics: StarterTopicDef[];
  exercise?: {
    title: string;
    objective: string;
    expectedOutput: string;
    difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
    estimatedMinutes: number;
  };
}

export interface DomainRoadmapTemplate {
  slug: string;
  domain: AcademicDomain;
  roleTitle: string;
  description: string;
  isStarterPathway: boolean;
  regionNote: string;
  phases: StarterPhaseDef[];
}

function makeTopic(params: {
  slug: string;
  orderIndex: number;
  title: string;
  overview: string;
  whyItMatters: string;
  difficulty?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  estimatedMinutes?: number;
  priority?: "ESSENTIAL" | "RECOMMENDED" | "OPTIONAL";
  prereqSlugs?: string[];
  subtopics: string[];
  outcomes: string[];
  criteria: string[];
  prompts: string[];
}): StarterTopicDef {
  return {
    slug: params.slug,
    orderIndex: params.orderIndex,
    title: params.title,
    overview: params.overview,
    whyItMatters: params.whyItMatters,
    difficulty: params.difficulty ?? "BEGINNER",
    estimatedMinutes: params.estimatedMinutes ?? 60,
    priority: params.priority ?? "ESSENTIAL",
    prerequisiteSlugs: params.prereqSlugs ?? [],
    subtopics: params.subtopics,
    learningOutcomes: params.outcomes,
    completionCriteria: params.criteria,
    practicePrompts: params.prompts,
  };
}

function buildStarterPhases(
  domain: AcademicDomain,
  config: {
    prefix: string;
    foundationTitle: string;
    foundationTopics: [string, string, string[]];
    coreTitle: string;
    coreTopics: [string, string, string[]];
    interviewTitle: string;
    interviewTopics: [string, string, string[]];
    exerciseTitle: string;
    exercisePrompt: string;
  }
): StarterPhaseDef[] {
  const t1 = `${config.prefix}-foundations`;
  const t2 = `${config.prefix}-standards-ethics`;
  const t3 = `${config.prefix}-applied-practice`;
  const t4 = `${config.prefix}-case-analysis`;
  const t5 = `${config.prefix}-interview-scenarios`;
  const t6 = `${config.prefix}-evidence-storytelling`;

  return [
    {
      orderIndex: 1,
      title: config.foundationTitle,
      description: `Core principles and terminology for ${domain}.`,
      estimatedHours: 6,
      topics: [
        makeTopic({
          slug: t1,
          orderIndex: 1,
          title: config.foundationTopics[0],
          overview: config.foundationTopics[1],
          whyItMatters: `Establishes clear foundational fluency for ${domain} interviews.`,
          subtopics: config.foundationTopics[2],
          outcomes: [`Explain core ${domain} concepts clearly without jargon.`],
          criteria: ["Summarize 3 foundational principles in your own words."],
          prompts: [`Walk an interviewer through how you apply ${config.foundationTopics[0]} in practice.`],
        }),
        makeTopic({
          slug: t2,
          orderIndex: 2,
          title: "Professional Standards & Documentation",
          overview: `Safety, compliance awareness, and record-keeping norms in ${domain}.`,
          whyItMatters: "Employers test awareness of safety, quality, and escalation norms early.",
          prereqSlugs: [t1],
          subtopics: ["Ethical boundaries", "Quality documentation", "Escalation protocols"],
          outcomes: ["Identify when to escalate issues and verify region-specific requirements."],
          criteria: ["Review official regional regulatory guidance for your target jurisdiction."],
          prompts: ["Describe how you handle ambiguity or compliance checks in a real task."],
        }),
      ],
      exercise: {
        title: config.exerciseTitle,
        objective: config.exercisePrompt,
        expectedOutput: "Structured 1-page domain brief citing verified coursework or project evidence.",
        difficulty: "BEGINNER",
        estimatedMinutes: 45,
      },
    },
    {
      orderIndex: 2,
      title: config.coreTitle,
      description: `Applied workflows, problem-solving, and evidence preparation in ${domain}.`,
      estimatedHours: 8,
      topics: [
        makeTopic({
          slug: t3,
          orderIndex: 1,
          title: config.coreTopics[0],
          overview: config.coreTopics[1],
          whyItMatters: `Demonstrates hands-on execution readiness in ${domain}.`,
          difficulty: "INTERMEDIATE",
          prereqSlugs: [t2],
          subtopics: config.coreTopics[2],
          outcomes: [`Execute core ${domain} workflows step by step.`],
          criteria: ["Complete one applied case walkthrough and document outcomes."],
          prompts: [`Describe a challenging ${domain} workflow you completed.`],
        }),
        makeTopic({
          slug: t4,
          orderIndex: 2,
          title: "Case Study & Trade-off Evaluation",
          overview: "Structured decision-making under real-world constraints.",
          whyItMatters: "Helps defend trade-offs concisely during technical and panel reviews.",
          difficulty: "INTERMEDIATE",
          priority: "RECOMMENDED",
          prereqSlugs: [t3],
          subtopics: ["Root-cause analysis", "Stakeholder communication", "Risk mitigation"],
          outcomes: ["Justify decisions using evidence and measurable outcomes."],
          criteria: ["Outline 2 trade-offs from a past project or internship."],
          prompts: ["Tell me about a time constraints forced you to adapt your approach."],
        }),
      ],
      exercise: {
        title: `${domain} Case Walkthrough`,
        objective: `Document one realistic scenario in ${domain}, listing inputs, decision criteria, and expected outcomes.`,
        expectedOutput: "Case study summary with clear decision rationale.",
        difficulty: "INTERMEDIATE",
        estimatedMinutes: 60,
      },
    },
    {
      orderIndex: 3,
      title: config.interviewTitle,
      description: `Role-specific interview readiness and Proof Bank storytelling for ${domain}.`,
      estimatedHours: 5,
      topics: [
        makeTopic({
          slug: t5,
          orderIndex: 1,
          title: config.interviewTopics[0],
          overview: config.interviewTopics[1],
          whyItMatters: "Prepares structured answers for scenario and situational panels.",
          difficulty: "INTERMEDIATE",
          prereqSlugs: [t3],
          subtopics: config.interviewTopics[2],
          outcomes: ["Answer situational and domain questions using structured frameworks."],
          criteria: ["Practice 3 domain-specific scenario responses aloud."],
          prompts: [`How do you prioritize competing demands in ${domain}?`],
        }),
        makeTopic({
          slug: t6,
          orderIndex: 2,
          title: "STAR Evidence & Proof Bank Mapping",
          overview: "Connect Career Passport projects, internships, and coursework to interview prompts.",
          whyItMatters: "Anchors behavioral responses in verified student records.",
          priority: "ESSENTIAL",
          prereqSlugs: [t5],
          subtopics: ["Situation & Task framing", "Individual Action clarity", "Verified Result metrics"],
          outcomes: ["Deliver concise STAR stories backed exclusively by your own verified evidence."],
          criteria: ["Save 2 STAR responses linked to Career Passport or Evidence Vault items."],
          prompts: ["Share a verified example where your action improved a measurable outcome."],
        }),
      ],
      exercise: {
        title: "Verified STAR Portfolio Draft",
        objective: `Write 2 STAR responses tailored to ${domain} using only your real Career Passport / Evidence Vault records.`,
        expectedOutput: "Two complete STAR narratives with cited evidence.",
        difficulty: "INTERMEDIATE",
        estimatedMinutes: 45,
      },
    },
  ];
}

interface DomainConfigEntry {
  slug: string;
  roleTitle: string;
  description: string;
  regionNote: string;
  prefix: string;
  foundationTitle: string;
  foundationTopics: [string, string, string[]];
  coreTitle: string;
  coreTopics: [string, string, string[]];
  interviewTitle: string;
  interviewTopics: [string, string, string[]];
  exerciseTitle: string;
  exercisePrompt: string;
}

const DOMAIN_CONFIGS: Record<AcademicDomain, DomainConfigEntry> = {
  "Engineering and Technology": {
    slug: "engineering-core-starter",
    roleTitle: "Graduate Engineer",
    description: "Starter pathway covering engineering fundamentals, design calculations, safety standards, and technical interviews.",
    regionNote: "Verify local engineering board / statutory codes for your target country.",
    prefix: "eng",
    foundationTitle: "Engineering Principles & Safety",
    foundationTopics: ["Core Mechanics, Circuits & Thermodynamics", "Fundamental equations, units, and tolerances.", ["Free-body / circuit diagrams", "Material properties", "Error analysis"]],
    coreTitle: "Applied Design & CAD/Simulation",
    coreTopics: ["Design Trade-offs & Testing", "Selecting materials, tolerances, and validation tests.", ["CAD / simulation checks", "Failure mode analysis", "Manufacturability"]],
    interviewTitle: "Engineering Technical & Panel Prep",
    interviewTopics: ["Design Walkthroughs & Root-Cause Scenarios", "Explaining lab, capstone, or plant projects clearly.", ["Constraint trade-offs", "Safety escalation", "Cross-team handoffs"]],
    exerciseTitle: "Capstone / Lab Design Brief",
    exercisePrompt: "Document one engineering problem you solved, including constraints, assumptions, calculations, and test results.",
  },
  "Computer Science and IT": {
    slug: "full-stack-developer-v1",
    roleTitle: "Full-Stack Developer",
    description: "10-phase Full-Stack Developer curriculum.",
    regionNote: "Global software engineering standards.",
    prefix: "cs",
    foundationTitle: "Foundations",
    foundationTopics: ["Web & Systems Foundations", "Core CS concepts", ["HTTP", "Git", "Data Structures"]],
    coreTitle: "Full-Stack Implementation",
    coreTopics: ["APIs & Databases", "Backend & Frontend integration", ["REST", "SQL", "Auth"]],
    interviewTitle: "Technical & System Design Interviews",
    interviewTopics: ["Coding & Architecture", "Problem solving under constraints", ["Algorithms", "Debugging"]],
    exerciseTitle: "Full-Stack Brief",
    exercisePrompt: "Summarize a full-stack architecture.",
  },
  "Commerce, Accounting and Finance": {
    slug: "commerce-finance-starter",
    roleTitle: "Finance & Accounting Analyst",
    description: "Starter pathway for accounting fundamentals, financial analysis, audit controls, and case interviews.",
    regionNote: "Confirm local GAAP / IFRS / tax rules applicable to your target jurisdiction.",
    prefix: "fin",
    foundationTitle: "Accounting & Financial Statements",
    foundationTopics: ["Three-Statement Foundations", "Income statement, balance sheet, and cash flow linkages.", ["Accrual vs cash", "Working capital", "Ratio analysis"]],
    coreTitle: "Financial Modeling & Controls",
    coreTopics: ["Valuation, Budgeting & Internal Controls", "Practical reconciliation, variance analysis, and audit trails.", ["DCF / comps basics", "Variance analysis", "Control checks"]],
    interviewTitle: "Finance Case & Behavioral Prep",
    interviewTopics: ["Technical Finance & Ethics Scenarios", "Defending assumptions and handling audit discrepancies.", ["Three-statement questions", "Ethical judgment", "Client communication"]],
    exerciseTitle: "Three-Statement Analysis Brief",
    exercisePrompt: "Analyze a public company's latest annual report across profitability, liquidity, and cash conversion.",
  },
  "Business and Management": {
    slug: "business-strategy-starter",
    roleTitle: "Business & Strategy Associate",
    description: "Starter pathway for business operations, structured problem solving, KPIs, and stakeholder interviews.",
    regionNote: "Adapt market benchmarks to your target region and industry.",
    prefix: "biz",
    foundationTitle: "Business & Operations Foundations",
    foundationTopics: ["Unit Economics & Market Sizing", "Revenue drivers, cost structures, and customer value.", ["TAM/SAM/SOM", "Contribution margin", "Funnel metrics"]],
    coreTitle: "Execution & Stakeholder Alignment",
    coreTopics: ["Structured Case & Process Improvement", "Breaking ambiguous business problems into testable hypotheses.", ["Issue trees", "Prioritization matrices", "KPI dashboards"]],
    interviewTitle: "Case & Leadership Interviews",
    interviewTopics: ["Case Structuring & Behavioral Leadership", "Communicating recommendations concisely to executives.", ["Hypothesis-led answers", "Conflict resolution", "Metrics ownership"]],
    exerciseTitle: "Business Case Memo",
    exercisePrompt: "Write a 1-page structured memo diagnosing a declining metric and proposing 2 prioritized experiments.",
  },
  "Science and Research": {
    slug: "pure-sciences-starter",
    roleTitle: "Research / Laboratory Scientist",
    description: "Starter pathway for experimental design, statistical rigor, lab safety, and scientific interviews.",
    regionNote: "Follow institutional biosafety/chemical safety regulations in your region.",
    prefix: "sci",
    foundationTitle: "Experimental Design & Quantitative Rigor",
    foundationTopics: ["Controls, Variables & Error Propagation", "Formulating falsifiable hypotheses and clean controls.", ["Hypothesis testing", "Confidence intervals", "Reproducibility"]],
    coreTitle: "Data Analysis & Lab Documentation",
    coreTopics: ["Lab Notebooks, Protocols & Visualization", "Maintaining traceable data and troubleshooting anomalies.", ["SOP adherence", "Statistical checks", "Clear figures"]],
    interviewTitle: "Technical & Research Talk Prep",
    interviewTopics: ["Explaining Research & Troubleshooting", "Presenting your methodology to specialists and non-specialists.", ["2-minute research pitch", "Failed-experiment lessons", "Safety protocols"]],
    exerciseTitle: "Experiment Critique",
    exercisePrompt: "Document one lab or quantitative project, highlighting controls, uncertainty sources, and next steps.",
  },
  "Healthcare and Medical Sciences": {
    slug: "medicine-public-health-starter",
    roleTitle: "Medical / Public Health Candidate",
    description: "Starter pathway for clinical reasoning, epidemiology, medical ethics, and structured MMI/panel interviews.",
    regionNote: "Verify licensing and postgraduate training requirements with your regional medical/public health authority.",
    prefix: "med",
    foundationTitle: "Clinical Reasoning & Epidemiology",
    foundationTopics: ["Differential Thinking & Population Health", "Structured history framing and epidemiological measures.", ["Sensitivity/specificity", "Risk factors", "Social determinants"]],
    coreTitle: "Medical Ethics & Health Systems",
    coreTopics: ["Informed Consent, Confidentiality & Triage", "Balancing autonomy, beneficence, and resource stewardship.", ["Consent capacity", "Data privacy", "Quality improvement"]],
    interviewTitle: "MMI & Panel Interview Readiness",
    interviewTopics: ["Structured MMI Stations & Empathy", "Responding clearly to ethical and teamwork stations.", ["Ethical frameworks", "Breaking difficult news", "Team accountability"]],
    exerciseTitle: "Public Health / Clinical Case Brief",
    exercisePrompt: "Outline a community health intervention or de-identified clinical case with measurable evaluation criteria.",
  },
  "Pharmacy, Nursing and Allied Health": {
    slug: "nursing-allied-health-starter",
    roleTitle: "Clinical & Allied Health Practitioner",
    description: "Starter pathway for clinical safety, patient-centered communication, evidence-based practice, and healthcare interviews.",
    regionNote: "Always verify national/state registration and clinical scope-of-practice rules in your jurisdiction.",
    prefix: "health",
    foundationTitle: "Patient Safety & Clinical Foundations",
    foundationTopics: ["Infection Control, Triage & Patient Safety", "Core clinical observation, hand hygiene, and escalation.", ["Vital signs & red flags", "Medication safety checks", "Patient confidentiality"]],
    coreTitle: "Evidence-Based Care & Interdisciplinary Teams",
    coreTopics: ["Care Planning & Clinical Documentation", "Accurate charting, SBAR handoffs, and multidisciplinary collaboration.", ["SBAR communication", "Evidence-based protocols", "Patient education"]],
    interviewTitle: "Clinical Scenario & Values-Based Interviews",
    interviewTopics: ["Ethical Dilemmas & Prioritization Scenarios", "Handling high-acuity situations calmly and safely.", ["Shift prioritization", "Empathetic communication", "Scope-of-practice boundaries"]],
    exerciseTitle: "SBAR Clinical Reflection",
    exercisePrompt: "Draft a de-identified SBAR communication walkthrough from your clinical placement or coursework.",
  },
  "Law and Legal Studies": {
    slug: "law-legal-studies-starter",
    roleTitle: "Legal Associate / Trainee",
    description: "Starter pathway for legal research, IRAC reasoning, contract/statutory analysis, and training-contract interviews.",
    regionNote: "Confirm bar/solicitor qualification rules and statutory citations for your specific jurisdiction.",
    prefix: "law",
    foundationTitle: "Legal Reasoning & Statutory Analysis",
    foundationTopics: ["IRAC / CLEO Analytical Structure", "Identifying issues, binding rules, and structured application.", ["Issue spotting", "Precedent vs statute", "Plain-English drafting"]],
    coreTitle: "Commercial Awareness & Due Diligence",
    coreTopics: ["Contract Clauses, Risk Allocation & Ethics", "Spotting liability, confidentiality, and conflict-of-interest risks.", ["Indemnity & liability", "Client confidentiality", "Due diligence checklists"]],
    interviewTitle: "Legal Case & Training Interviews",
    interviewTopics: ["Commercial Awareness & Advocacy", "Defending a legal position concisely under questioning.", ["Oral advocacy", "Commercial impact", "Ethical red lines"]],
    exerciseTitle: "IRAC Case Note",
    exercisePrompt: "Write a concise IRAC analysis of a recent landmark decision or hypothetical contract dispute.",
  },
  "Arts and Humanities": {
    slug: "arts-humanities-starter",
    roleTitle: "Research, Policy & Communications Analyst",
    description: "Starter pathway for qualitative research, critical synthesis, policy writing, and competency interviews.",
    regionNote: "Tailor policy/institutional references to your target country.",
    prefix: "arts",
    foundationTitle: "Critical Inquiry & Research Methods",
    foundationTopics: ["Qualitative & Quantitative Evidence Synthesis", "Evaluating primary sources, bias, and methodology.", ["Source triangulation", "Argument structure", "Research ethics"]],
    coreTitle: "Writing, Policy & Stakeholder Synthesis",
    coreTopics: ["Executive Briefs & Persuasive Writing", "Turning dense research into clear recommendations.", ["1-page policy brief", "Audience framing", "Counter-argument handling"]],
    interviewTitle: "Competency & Analytical Interviews",
    interviewTopics: ["Defending Research & Collaboration", "Connecting academic projects to organizational impact.", ["Research-to-action", "Deadline management", "Cross-cultural awareness"]],
    exerciseTitle: "Executive Synthesis Brief",
    exercisePrompt: "Summarize a complex social or policy topic into a 400-word brief with 2 actionable recommendations.",
  },
  "Design, Architecture and Creative Industries": {
    slug: "design-architecture-starter",
    roleTitle: "Designer / Architectural Associate",
    description: "Starter pathway for design thinking, accessibility, portfolio critique, and studio interviews.",
    regionNote: "Check local building/planning codes where architectural practice applies.",
    prefix: "design",
    foundationTitle: "Design Foundations & Accessibility",
    foundationTopics: ["Visual Hierarchy, Systems & Spatial Logic", "Human-centered principles, contrast, and usability.", ["Typography & grids", "WCAG accessibility", "Material/form constraints"]],
    coreTitle: "Research, Prototyping & Critique",
    coreTopics: ["User Research & Iterative Critique", "Translating research insights into tested prototypes.", ["Usability testing", "Design systems", "Constructive critique"]],
    interviewTitle: "Portfolio Walkthrough & Whiteboard Prep",
    interviewTopics: ["Case Study Storytelling & Constraints", "Articulating problem framing, iterations, and measurable impact.", ["3-minute case pitch", "Trade-off defense", "Engineering/client handoff"]],
    exerciseTitle: "Portfolio Case Study Outline",
    exercisePrompt: "Structure one portfolio project around Problem -> Research -> Iterations -> Final Outcome.",
  },
  "Education and Teaching": {
    slug: "education-teaching-starter",
    roleTitle: "Educator / Teaching Candidate",
    description: "Starter pathway for lesson design, formative assessment, inclusive classrooms, and teaching interviews.",
    regionNote: "Verify regional teacher credentialing and safeguarding requirements.",
    prefix: "edu",
    foundationTitle: "Curriculum & Inclusive Pedagogy",
    foundationTopics: ["Learning Objectives & Differentiation", "Designing accessible lessons for diverse learners.", ["Backward design", "UDL principles", "Scaffolding"]],
    coreTitle: "Assessment & Classroom Culture",
    coreTopics: ["Formative Assessment & Behaviour Support", "Checking understanding and fostering safe participation.", ["Exit tickets & rubrics", "Restorative routines", "Parent communication"]],
    interviewTitle: "Demo Lesson & Safeguarding Prep",
    interviewTopics: ["Teaching Demo & Scenario Questions", "Reflecting constructively on lesson adjustments.", ["10-minute micro-lesson", "Safeguarding awareness", "Student engagement"]],
    exerciseTitle: "Micro-Lesson Plan",
    exercisePrompt: "Design a 20-minute lesson plan with 2 learning objectives, 1 formative check, and 1 differentiation strategy.",
  },
  "Agriculture and Environmental Sciences": {
    slug: "agriculture-food-starter",
    roleTitle: "Agronomy / Environmental Specialist",
    description: "Starter pathway for sustainable production, food safety systems, field trials, and domain interviews.",
    regionNote: "Confirm national food safety and environmental compliance standards in your jurisdiction.",
    prefix: "agri",
    foundationTitle: "Production Systems & Quality Safety",
    foundationTopics: ["Soil, Crop/Ecosystem Health & Safety", "Foundational biological and quality-assurance principles.", ["HACCP / hygiene awareness", "Resource sustainability", "Field sampling"]],
    coreTitle: "Field Trials & Supply Chain Traceability",
    coreTopics: ["Trial Evaluation & Environmental Monitoring", "Measuring yield, shelf-life, and compliance records.", ["Trial design", "Traceability logs", "Cost-yield trade-offs"]],
    interviewTitle: "Field Scenario & Stakeholder Interviews",
    interviewTopics: ["Practical Troubleshooting & Extension", "Communicating technical guidance to growers or site teams.", ["Contamination response", "Seasonal planning", "Stakeholder trust"]],
    exerciseTitle: "Quality & Trial Brief",
    exercisePrompt: "Outline an environmental/food-safety check or field trial design with clear pass/fail metrics.",
  },
  "Hospitality, Tourism and Hotel Management": {
    slug: "hospitality-aviation-starter",
    roleTitle: "Hospitality / Tourism Operations Associate",
    description: "Starter pathway for service excellence, safety/SOP compliance, revenue ops, and scenario interviews.",
    regionNote: "Verify hospitality/tourism regulatory certifications required by your local authority.",
    prefix: "hosp",
    foundationTitle: "Service Standards & Safety SOPs",
    foundationTopics: ["Guest Experience & Operational Safety", "Balancing warmth, speed, and strict safety procedures.", ["SOP adherence", "Accessibility service", "Emergency readiness"]],
    coreTitle: "Operations, Scheduling & Recovery",
    coreTopics: ["Service Recovery & Peak-Load Coordination", "Handling delays, overbooking, and guest complaints calmly.", ["De-escalation", "Cross-shift handoffs", "Occupancy/yield basics"]],
    interviewTitle: "Situational & Customer Recovery Prep",
    interviewTopics: ["High-Pressure Guest & Safety Scenarios", "Demonstrating composure, empathy, and teamwork.", ["Angry-guest recovery", "Safety vs speed", "Team coordination"]],
    exerciseTitle: "Service Recovery Playbook",
    exercisePrompt: "Write a step-by-step response plan for a peak-hour operational disruption or service failure.",
  },
  "Media, Journalism and Communication": {
    slug: "media-journalism-starter",
    roleTitle: "Media & Communications Specialist",
    description: "Starter pathway for editorial verification, storytelling, audience analytics, and portfolio interviews.",
    regionNote: "Follow regional defamation, copyright, and press standards.",
    prefix: "media",
    foundationTitle: "Editorial Rigor & Fact-Checking",
    foundationTopics: ["Source Verification & Media Ethics", "Primary sourcing, attribution, and accuracy checks.", ["Two-source verification", "Fairness & attribution", "Copyright awareness"]],
    coreTitle: "Multi-Format Production & Distribution",
    coreTopics: ["Writing, Audio/Video & Audience Metrics", "Adapting stories across print, web, and social formats.", ["Headline clarity", "Editing workflow", "Engagement analytics"]],
    interviewTitle: "Pitching & Editorial Judgment Interviews",
    interviewTopics: ["Story Pitches & Tight-Deadline Scenarios", "Defending editorial choices under time pressure.", ["60-second story pitch", "Corrections handling", "Deadline triage"]],
    exerciseTitle: "Verified Story Pitch",
    exercisePrompt: "Draft a 250-word story or campaign pitch listing primary sources and verification steps.",
  },
  "Government and Public Services": {
    slug: "public-services-starter",
    roleTitle: "Public Service / Policy Candidate",
    description: "Starter pathway for public administration, constitutional/civic awareness, ethics, and panel interviews.",
    regionNote: "Focus on the civil service / public-sector framework of your specific country or state.",
    prefix: "gov",
    foundationTitle: "Public Administration & Ethics",
    foundationTopics: ["Accountability, Transparency & Rule of Law", "Impartiality, public-interest stewardship, and records.", ["Conflict of interest", "Public accountability", "Policy cycle"]],
    coreTitle: "Program Delivery & Citizen Impact",
    coreTopics: ["Policy Implementation & Resource Constraints", "Evaluating public programs for equity, cost, and feasibility.", ["Stakeholder consultation", "Implementation risks", "Outcome metrics"]],
    interviewTitle: "Board & Situational Judgment Prep",
    interviewTopics: ["Integrity Dilemmas & Structured Panels", "Handling ethical pressure and competing public priorities.", ["Ethical neutrality", "Crisis coordination", "Balanced viewpoints"]],
    exerciseTitle: "Public Policy Note",
    exercisePrompt: "Draft a 1-page neutral policy note analyzing one public-service challenge with pros, cons, and implementation steps.",
  },
  "Vocational and Skill-Based Education": {
    slug: "vocational-trades-starter",
    roleTitle: "Skilled Technician / Trade Specialist",
    description: "Starter pathway for workplace safety, fault diagnostics, tool/quality checks, and practical interviews.",
    regionNote: "Confirm local trade licensing and occupational safety certifications.",
    prefix: "trade",
    foundationTitle: "Workplace Safety & Tool Readiness",
    foundationTopics: ["Lockout/Tagout, PPE & Hazard Identification", "Preventing injuries and verifying equipment calibration.", ["PPE compliance", "Hazard checks", "Manual reading"]],
    coreTitle: "Diagnostics & Quality Workmanship",
    coreTopics: ["Systematic Fault Finding & Preventive Maintenance", "Isolating root causes safely and documenting repairs.", ["Step-by-step diagnostics", "Quality sign-off", "Parts/time estimation"]],
    interviewTitle: "Practical & Safety Scenario Interviews",
    interviewTopics: ["Safety Refusal & Troubleshooting Walkthroughs", "Explaining hands-on repairs clearly to supervisors.", ["Safety-first decisions", "Teamwork on site", "Customer handoff"]],
    exerciseTitle: "Diagnostic Checklist",
    exercisePrompt: "Write a safe diagnostic and sign-off checklist for a common equipment or trade task in your field.",
  },
  "Other / Emerging Fields": {
    slug: "interdisciplinary-career-starter",
    roleTitle: "Interdisciplinary Specialist",
    description: "Starter pathway for translating cross-functional projects, evidence, and problem-solving into interview readiness.",
    regionNote: "Verify any domain-specific regulations relevant to your target role.",
    prefix: "other",
    foundationTitle: "Role Alignment & Core Framing",
    foundationTopics: ["Translating Interdisciplinary Experience", "Connecting diverse academic and project skills to job needs.", ["Role deconstruction", "Transferable skills", "Clear positioning"]],
    coreTitle: "Structured Problem Solving",
    coreTopics: ["Cross-Functional Execution & Metrics", "Collaborating across technical and non-technical stakeholders.", ["Goal framing", "Stakeholder alignment", "Outcome tracking"]],
    interviewTitle: "Behavioral & Portfolio Interviews",
    interviewTopics: ["Unified Career Narrative & STAR Proof", "Presenting interdisciplinary work cohesively.", ["Career narrative", "Evidence citations", "Adaptability examples"]],
    exerciseTitle: "Role-Alignment Matrix",
    exercisePrompt: "Map 3 requirements from a target job description to 3 verified examples from your Career Passport.",
  },
};

export function getDomainRoadmapTemplate(
  domain: string | null | undefined,
  _roleTitle?: string | null
): DomainRoadmapTemplate | null {
  if (!domain) return null;
  const normalized = domain.trim() as AcademicDomain;
  if (!ACADEMIC_DOMAINS.includes(normalized)) return null;

  const cfg = DOMAIN_CONFIGS[normalized];
  if (!cfg) return null;

  return {
    slug: cfg.slug,
    domain: normalized,
    roleTitle: cfg.roleTitle,
    description: cfg.description,
    isStarterPathway: normalized !== "Computer Science and IT",
    regionNote: cfg.regionNote,
    phases: buildStarterPhases(normalized, cfg),
  };
}
