"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, ShieldCheck, Sparkles, X } from "lucide-react";
import {
  ACADEMIC_DOMAINS,
  EXPERIENCE_LEVELS,
  PREPARATION_DURATIONS,
  WEEKLY_AVAILABILITIES,
  getInterviewFocusOptionsForDomain,
  getTargetLevelsForDomain,
  normalizeDomainToAcademic,
  type ExperienceLevel,
  type InterviewFocusAreas,
  type InterviewPassportPreviewResult,
  type PassportContextPreview,
  type PreparationDuration,
  type PreparedInterviewKit,
  type TargetLevel,
  type WeeklyAvailability,
} from "@/lib/interview/types";
import { StepIndicator, type WizardStepItem } from "@/components/interview/ui/step-indicator";
import { Toast } from "@/components/interview/ui/toast";

interface CreateKitWizardProps {
  open: boolean;
  onClose: () => void;
  onCreated: (kit: PreparedInterviewKit) => void;
  passportPreview: InterviewPassportPreviewResult | null;
  initialJobTitle?: string;
  initialCompany?: string;
  initialDomain?: string;
}

const WIZARD_STEPS: readonly WizardStepItem[] = [
  { id: 0, title: "Target Role", shortTitle: "Role" },
  { id: 1, title: "Experience & Level", shortTitle: "Level" },
  { id: 2, title: "Focus & Schedule", shortTitle: "Schedule" },
  { id: 3, title: "Career Passport", shortTitle: "Personalize" },
  { id: 4, title: "Review & Generate", shortTitle: "Review" },
];

export function CreateKitWizard({
  open,
  onClose,
  onCreated,
  passportPreview,
  initialJobTitle,
  initialCompany,
  initialDomain,
}: CreateKitWizardProps) {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ jobTitle?: string; date?: string }>({});

  const passportStatus = passportPreview?.status || "EMPTY";
  const initialPassportData = passportPreview?.data || null;

  // Step 1: Target Role
  const [jobTitle, setJobTitle] = useState(initialJobTitle || "");
  const [companyName, setCompanyName] = useState(initialCompany || "");
  const [domain, setDomain] = useState(() =>
    initialDomain
      ? normalizeDomainToAcademic(initialDomain)
      : initialPassportData?.academicDomain
      ? normalizeDomainToAcademic(initialPassportData.academicDomain)
      : "Computer Science and IT"
  );
  const [location, setLocation] = useState("");

  // Step 2: Experience & Level
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | "">("");
  const [targetLevel, setTargetLevel] = useState<TargetLevel | "">("");

  // Step 3: Focus & Schedule
  const [interviewTypes, setInterviewTypes] = useState<string[]>([]);
  const [expectedInterviewDate, setExpectedInterviewDate] = useState("");
  const [preparationDuration, setPreparationDuration] = useState<PreparationDuration | "">("");
  const [weeklyAvailability, setWeeklyAvailability] = useState<WeeklyAvailability | "">("");

  // Step 4: Personalization (strictly defaults to false)
  const [useCareerPassport, setUseCareerPassport] = useState(false);
  const [editablePassport] = useState<PassportContextPreview | null>(initialPassportData);
  const [focusAreas] = useState<InterviewFocusAreas>({
    strengthenSkills: [],
    difficultTopics: [],
    targetRoleSkills: [],
    priorityAreas: [],
  });
  const [jobDescriptionText, setJobDescriptionText] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, submitting, onClose]);

  if (!open) return null;

  const domainOptions = getInterviewFocusOptionsForDomain(domain);
  const targetLevels = getTargetLevelsForDomain(domain);

  const toggleItem = (list: string[], val: string) =>
    list.includes(val) ? list.filter((x) => x !== val) : [...list, val];

  const handleNext = () => {
    setError(null);
    setFieldErrors({});
    if (step === 0) {
      if (!jobTitle.trim() || jobTitle.trim().length < 2) {
        const msg = "Please enter a Job / Role Title (at least 2 characters).";
        setFieldErrors({ jobTitle: msg });
        setError(msg);
        return;
      }
    }
    if (step === 2 && expectedInterviewDate) {
      const parsed = new Date(expectedInterviewDate);
      if (Number.isNaN(parsed.getTime())) {
        const msg = "Please enter a valid interview date.";
        setFieldErrors({ date: msg });
        setError(msg);
        return;
      }
    }
    setStep((prev) => Math.min(WIZARD_STEPS.length - 1, prev + 1));
  };

  const handleBack = () => {
    setError(null);
    setFieldErrors({});
    setStep((prev) => Math.max(0, prev - 1));
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setError(null);
    if (!jobTitle.trim() || jobTitle.trim().length < 2) {
      setStep(0);
      setFieldErrors({ jobTitle: "Job / Role Title is required." });
      setError("Please enter a Job / Role Title (at least 2 characters).");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/interview-prep", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          createNew: true,
          jobTitle: jobTitle.trim(),
          companyName: companyName.trim() || null,
          domain,
          location: location.trim() || null,
          experienceLevel: experienceLevel || null,
          targetLevel: targetLevel || null,
          interviewTypes,
          expectedInterviewDate: expectedInterviewDate || null,
          preparationDuration: preparationDuration || null,
          weeklyAvailability: weeklyAvailability || null,
          learningFormats: [],
          preferredLanguage: "English",
          useCareerPassport,
          passportContext: useCareerPassport ? editablePassport : null,
          focusAreas,
          jobDescriptionText: jobDescriptionText.trim() || null,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not create Interview Prep Kit. Your inputs were preserved.");
        return;
      }
      onCreated(data as PreparedInterviewKit);
    } catch {
      setError("Network error while saving your kit. Your inputs were preserved.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-kit-wizard-title"
      className="fixed inset-0 z-50 bg-[#2B1B1B]/60 flex items-center justify-center sm:p-4"
    >
      <div className="bg-[#FFF8F0] w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-2xl sm:rounded-3xl border border-[#EBDDD1] shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="bg-white border-b border-[#EBDDD1] px-4 sm:px-6 py-4 flex items-center justify-between gap-3 shrink-0">
          <div>
            <h2
              id="create-kit-wizard-title"
              className="font-heading text-lg sm:text-xl font-bold text-[#2B1B1B]"
            >
              Create Interview Prep Kit
            </h2>
            <p className="text-sm text-[#59413F]">{WIZARD_STEPS[step].title}</p>
          </div>
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            aria-label="Close wizard"
            className="min-h-[44px] min-w-[44px] rounded-xl border border-[#EBDDD1] bg-white hover:bg-[#FFF8F0] inline-flex items-center justify-center text-[#59413F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A0F1F]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper */}
        <div className="bg-white border-b border-[#EBDDD1] px-4 sm:px-6 py-3 shrink-0">
          <StepIndicator
            steps={WIZARD_STEPS}
            currentStep={step}
            onStepClick={(idx) => {
              setError(null);
              setStep(idx);
            }}
            canJumpTo={(idx) => idx <= step || jobTitle.trim().length >= 2}
          />
        </div>

        {/* Scrollable Step Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {error && <Toast type="err" message={error} onDismiss={() => setError(null)} />}

          {step === 0 && (
            <div className="bg-white rounded-2xl border border-[#EBDDD1] p-4 sm:p-5 space-y-4">
              <div>
                <label
                  htmlFor="wizard-domain"
                  className="block text-sm font-bold text-[#2B1B1B] mb-1.5"
                >
                  Professional Domain
                </label>
                <select
                  id="wizard-domain"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-[#D8C5B8] bg-white px-3 text-sm text-[#2B1B1B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A0F1F]"
                >
                  {ACADEMIC_DOMAINS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="wizard-job-title"
                  className="block text-sm font-bold text-[#2B1B1B] mb-1.5"
                >
                  Target Role / Job Title *
                </label>
                <input
                  id="wizard-job-title"
                  type="text"
                  value={jobTitle}
                  onChange={(e) => {
                    setJobTitle(e.target.value);
                    if (fieldErrors.jobTitle) setFieldErrors({});
                  }}
                  placeholder="e.g. Full-Stack Developer, Registered Nurse, Financial Analyst"
                  aria-invalid={Boolean(fieldErrors.jobTitle)}
                  className="w-full min-h-[44px] rounded-xl border border-[#D8C5B8] bg-white px-3 text-sm text-[#2B1B1B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A0F1F]"
                />
                {fieldErrors.jobTitle && (
                  <p className="text-xs font-semibold text-rose-700 mt-1">{fieldErrors.jobTitle}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="wizard-company"
                    className="block text-sm font-bold text-[#2B1B1B] mb-1.5"
                  >
                    Company / Organization (optional)
                  </label>
                  <input
                    id="wizard-company"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Apollo Hospitals, Razorpay"
                    className="w-full min-h-[44px] rounded-xl border border-[#D8C5B8] bg-white px-3 text-sm text-[#2B1B1B]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="wizard-location"
                    className="block text-sm font-bold text-[#2B1B1B] mb-1.5"
                  >
                    Location (optional)
                  </label>
                  <input
                    id="wizard-location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Bengaluru or Remote"
                    className="w-full min-h-[44px] rounded-xl border border-[#D8C5B8] bg-white px-3 text-sm text-[#2B1B1B]"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="bg-white rounded-2xl border border-[#EBDDD1] p-4 sm:p-5 space-y-5">
              <div>
                <p className="text-sm font-bold text-[#2B1B1B] mb-2">Current Experience</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {EXPERIENCE_LEVELS.map((lvl) => (
                    <button
                      key={lvl.value}
                      type="button"
                      onClick={() => setExperienceLevel(lvl.value)}
                      className={`min-h-[44px] text-left px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
                        experienceLevel === lvl.value
                          ? "bg-[#7A0F1F] text-white border-[#7A0F1F]"
                          : "bg-[#FFF8F0] text-[#2B1B1B] border-[#D8C5B8] hover:border-[#7A0F1F]"
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-bold text-[#2B1B1B] mb-2">Target Role Level</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {targetLevels.map((lvl) => (
                    <button
                      key={lvl.value}
                      type="button"
                      onClick={() => setTargetLevel(lvl.value)}
                      className={`min-h-[44px] text-left px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
                        targetLevel === lvl.value
                          ? "bg-[#7A0F1F] text-white border-[#7A0F1F]"
                          : "bg-[#FFF8F0] text-[#2B1B1B] border-[#D8C5B8] hover:border-[#7A0F1F]"
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="bg-white rounded-2xl border border-[#EBDDD1] p-4 sm:p-5 space-y-4">
              <div>
                <p className="text-sm font-bold text-[#2B1B1B] mb-2">
                  Interview Rounds to Practice
                </p>
                <div className="flex flex-wrap gap-2">
                  {domainOptions.interviewTypes.map((t) => {
                    const active = interviewTypes.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setInterviewTypes((curr) => toggleItem(curr, t))}
                        className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-sm font-semibold transition-colors ${
                          active
                            ? "bg-[#7A0F1F] text-white border-[#7A0F1F]"
                            : "bg-[#FFF8F0] text-[#2B1B1B] border-[#D8C5B8] hover:border-[#7A0F1F]"
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label
                    htmlFor="wizard-date"
                    className="block text-sm font-bold text-[#2B1B1B] mb-1.5"
                  >
                    Interview Date
                  </label>
                  <input
                    id="wizard-date"
                    type="date"
                    value={expectedInterviewDate}
                    onChange={(e) => setExpectedInterviewDate(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-[#D8C5B8] px-3 text-sm bg-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="wizard-duration"
                    className="block text-sm font-bold text-[#2B1B1B] mb-1.5"
                  >
                    Prep Timeline
                  </label>
                  <select
                    id="wizard-duration"
                    value={preparationDuration}
                    onChange={(e) => setPreparationDuration(e.target.value as PreparationDuration | "")}
                    className="w-full min-h-[44px] rounded-xl border border-[#D8C5B8] px-3 text-sm bg-white"
                  >
                    <option value="">Select timeline...</option>
                    {PREPARATION_DURATIONS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="wizard-weekly"
                    className="block text-sm font-bold text-[#2B1B1B] mb-1.5"
                  >
                    Weekly Hours
                  </label>
                  <select
                    id="wizard-weekly"
                    value={weeklyAvailability}
                    onChange={(e) => setWeeklyAvailability(e.target.value as WeeklyAvailability | "")}
                    className="w-full min-h-[44px] rounded-xl border border-[#D8C5B8] px-3 text-sm bg-white"
                  >
                    <option value="">Select hours...</option>
                    {WEEKLY_AVAILABILITIES.map((w) => (
                      <option key={w.value} value={w.value}>
                        {w.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="bg-white rounded-2xl border border-[#EBDDD1] p-4 sm:p-5 space-y-4">
              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-[#EBDDD1] bg-[#FFF8F0]/60">
                <input
                  type="checkbox"
                  checked={useCareerPassport}
                  onChange={(e) => setUseCareerPassport(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-[#D8C5B8] accent-[#7A0F1F]"
                />
                <div className="space-y-1">
                  <span className="text-sm font-bold text-[#2B1B1B] inline-flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                    <span>Use my Career Passport to personalize questions</span>
                  </span>
                  <p className="text-sm text-[#59413F]">
                    Off by default. Turn this on only if you want your recorded skills, projects,
                    and experiences linked into this kit ({passportStatus.toLowerCase()}).
                  </p>
                </div>
              </label>

              <div>
                <label
                  htmlFor="wizard-jd"
                  className="block text-sm font-bold text-[#2B1B1B] mb-1.5"
                >
                  Paste Job Description (optional)
                </label>
                <textarea
                  id="wizard-jd"
                  rows={4}
                  value={jobDescriptionText}
                  onChange={(e) => setJobDescriptionText(e.target.value)}
                  placeholder="Paste the job description or key responsibilities..."
                  className="w-full rounded-xl border border-[#D8C5B8] p-3 text-sm bg-white"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="bg-white rounded-2xl border border-[#EBDDD1] p-4 sm:p-5 space-y-3 text-sm">
              <h3 className="font-heading text-base font-bold text-[#2B1B1B]">
                Review Your Kit Settings
              </h3>
              <dl className="divide-y divide-[#EBDDD1]">
                <div className="py-2 flex justify-between gap-4">
                  <dt className="text-[#59413F]">Role &amp; Domain</dt>
                  <dd className="font-bold text-[#2B1B1B] text-right">
                    {jobTitle} • {domain}
                  </dd>
                </div>
                <div className="py-2 flex justify-between gap-4">
                  <dt className="text-[#59413F]">Company / Location</dt>
                  <dd className="font-semibold text-[#2B1B1B] text-right">
                    {[companyName, location].filter(Boolean).join(" • ") || "General"}
                  </dd>
                </div>
                <div className="py-2 flex justify-between gap-4">
                  <dt className="text-[#59413F]">Experience &amp; Target</dt>
                  <dd className="font-semibold text-[#2B1B1B] text-right">
                    {[experienceLevel, targetLevel].filter(Boolean).join(" → ") || "Default"}
                  </dd>
                </div>
                <div className="py-2 flex justify-between gap-4">
                  <dt className="text-[#59413F]">Career Passport</dt>
                  <dd className="font-semibold text-[#2B1B1B] text-right">
                    {useCareerPassport ? "Included (with your consent)" : "Not included"}
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </div>

        {/* Sticky Bottom Navigation */}
        <div className="bg-white border-t border-[#EBDDD1] px-4 sm:px-6 py-4 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            disabled={submitting}
            onClick={step === 0 ? onClose : handleBack}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[#D8C5B8] bg-white hover:bg-[#FFF8F0] text-sm font-semibold text-[#2B1B1B] inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A0F1F]"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>{step === 0 ? "Cancel" : "Back"}</span>
          </button>

          {step < WIZARD_STEPS.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#7A0F1F] hover:bg-[#4C0915] text-white text-sm font-bold inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2B63D]"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={() => void handleSubmit()}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#7A0F1F] hover:bg-[#4C0915] disabled:opacity-60 text-white text-sm font-bold inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2B63D]"
            >
              <Sparkles className="w-4 h-4 text-[#F2B63D]" aria-hidden="true" />
              <span>{submitting ? "Generating..." : "Create Interview Prep Kit"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
