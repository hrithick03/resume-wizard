import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Download,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Upload as UploadIcon,
  FileText,
} from "lucide-react";
import { DOMAINS, emptyResume, type Domain, type ResumeData, type TemplateId } from "@/lib/resume-types";
import { loadState, saveState } from "@/lib/storage";
import { generateDomainQuestions, parseResumeText, synthesizeResume } from "@/lib/groq.functions";
import { extractTextFromFile } from "@/lib/file-parser";
import { exportDOCX, exportPDF } from "@/lib/exporters";
import { ResumePreview } from "@/components/resume/ResumePreview";

const searchSchema = z.object({
  mode: z.enum(["new", "upload"]).catch("new").optional(),
});

export const Route = createFileRoute("/builder")({
  validateSearch: searchSchema,
  component: BuilderPage,
  head: () => ({
    meta: [
      { title: "Builder — Inkwell" },
      { name: "description", content: "Interactive AI resume builder." },
    ],
  }),
});

type Step = "intro" | "upload" | "basics" | "experience" | "education" | "domain" | "preview";

type DomainQuestion = { id: string; label: string; placeholder?: string; type?: string };

function BuilderPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(search.mode === "upload" ? "upload" : "intro");
  const [resume, setResume] = useState<ResumeData>(emptyResume);
  const [template, setTemplate] = useState<TemplateId>("minimal");
  const [targetDomain, setTargetDomain] = useState<Domain>("Software Engineering");
  const [domainQs, setDomainQs] = useState<DomainQuestion[]>([]);
  const [domainAnswers, setDomainAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const [customCurrentDomain, setCustomCurrentDomain] = useState("");
  const [customTargetDomain, setCustomTargetDomain] = useState("");

  const genQs = useServerFn(generateDomainQuestions);
  const parseFn = useServerFn(parseResumeText);
  const synth = useServerFn(synthesizeResume);

  // Load on mount
  useEffect(() => {
    const s = loadState();
    setResume(s.resume);
    setTemplate(s.template);
    setTargetDomain(s.resume.domain);

    const isCurrentCustom = s.resume.domain && !DOMAINS.filter(d => d !== "Other").includes(s.resume.domain);
    if (isCurrentCustom) {
      setCustomCurrentDomain(s.resume.domain);
    }
    const isTargetCustom = s.resume.domain && !DOMAINS.filter(d => d !== "Other").includes(s.resume.domain);
    if (isTargetCustom) {
      setCustomTargetDomain(s.resume.domain);
    }
  }, []);

  // Persist
  useEffect(() => {
    saveState({ resume, template });
  }, [resume, template]);

  const steps: { id: Step; label: string }[] = useMemo(
    () => [
      { id: "basics", label: "Basics" },
      { id: "experience", label: "Experience" },
      { id: "education", label: "Education" },
      { id: "domain", label: "Domain Q's" },
      { id: "preview", label: "Preview" },
    ],
    [],
  );

  const stepIdx = steps.findIndex((s) => s.id === step);

  /* ---------- Upload flow ---------- */
  const handleUpload = async (file: File) => {
    setBusy("Reading file…");
    try {
      const text = await extractTextFromFile(file);
      setBusy("Parsing with AI…");
      const res = await parseFn({ data: { text } });
      if (res.error || !res.resume) throw new Error(res.error ?? "Parse failed");
      setResume(res.resume);
      setTargetDomain(res.resume.domain as Domain);

      const parsedDomain = res.resume.domain;
      const isCustom = parsedDomain && !DOMAINS.filter(d => d !== "Other").includes(parsedDomain);
      if (isCustom) {
        setCustomCurrentDomain(parsedDomain);
        setCustomTargetDomain(parsedDomain);
      }
      toast.success("Resume parsed. Review and refine.");
      setStep("basics");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to read file");
    } finally {
      setBusy(null);
    }
  };

  /* ---------- Domain questions ---------- */
  const loadDomainQuestions = async () => {
    setBusy("Generating questions…");
    const finalTarget = targetDomain === "Other" ? customTargetDomain : targetDomain;
    const finalCurrent = resume.domain === "Other" ? customCurrentDomain : resume.domain;

    if (!finalTarget) {
      toast.error("Please specify your target domain first.");
      setBusy(null);
      return;
    }

    try {
      const res = await genQs({
        data: {
          domain: finalTarget,
          existing: {
            currentDomain: finalCurrent,
            title: resume.title,
            skills: resume.skills,
          },
        },
      });
      if (res.error) throw new Error(res.error);
      setDomainQs(res.questions);
      if (res.questions.length === 0) {
        toast.info("No extra questions needed for this domain.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  };

  /* ---------- Synthesize ---------- */
  const handleSynthesize = async () => {
    setBusy("Writing your resume…");
    const finalTarget = targetDomain === "Other" ? customTargetDomain : targetDomain;
    const finalCurrent = resume.domain === "Other" ? customCurrentDomain : resume.domain;

    if (!finalTarget) {
      toast.error("Please specify your target domain first.");
      setBusy(null);
      return;
    }

    try {
      const res = await synth({
        data: {
          rawAnswers: {
            ...domainAnswers,
            basics: {
              name: resume.name,
              title: resume.title,
              email: resume.email,
              phone: resume.phone,
              location: resume.location,
              website: resume.website,
              linkedin: resume.linkedin,
              summary: resume.summary,
              skills: resume.skills,
            },
            experience: resume.experience,
            education: resume.education,
            projects: resume.projects,
            certifications: resume.certifications,
            publications: resume.publications,
            volunteer: resume.volunteer,
          },
          domain: finalCurrent,
          targetDomain: finalTarget,
          existingResume: resume,
        },
      });
      if (res.error || !res.resume) throw new Error(res.error ?? "Failed");
      setResume({ ...res.resume, domain: finalTarget });
      toast.success("Resume refined.");
      setStep("preview");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="border-b border-rule">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="size-6 rounded-sm bg-ink" />
            <span className="font-display font-semibold tracking-tight">Inkwell</span>
          </Link>
          {step !== "intro" && step !== "upload" && (
            <nav className="hidden md:flex items-center gap-1 text-xs">
              {steps.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setStep(s.id)}
                  className={`px-3 py-1.5 rounded-sm transition ${
                    s.id === step
                      ? "bg-ink text-paper"
                      : i < stepIdx
                        ? "text-foreground hover:bg-paper-soft"
                        : "text-muted-foreground hover:bg-paper-soft"
                  }`}
                >
                  {i + 1}. {s.label}
                </button>
              ))}
            </nav>
          )}
          <div className="text-xs text-muted-foreground">Saved locally</div>
        </div>
      </div>

      {busy && (
        <div className="bg-ink text-paper px-6 py-2 text-sm flex items-center gap-2 justify-center">
          <Loader2 className="size-4 animate-spin" /> {busy}
        </div>
      )}

      <div className="mx-auto max-w-7xl px-6 py-10">
        {step === "intro" && (
          <IntroStep onNew={() => setStep("basics")} onUpload={() => setStep("upload")} />
        )}
        {step === "upload" && (
          <UploadStep
            onSkip={() => setStep("basics")}
            onFile={handleUpload}
            busy={!!busy}
          />
        )}
        {step === "basics" && (
          <BasicsStep
            resume={resume}
            setResume={setResume}
            customCurrentDomain={customCurrentDomain}
            setCustomCurrentDomain={setCustomCurrentDomain}
            onNext={() => setStep("experience")}
          />
        )}
        {step === "experience" && (
          <ExperienceStep
            resume={resume}
            setResume={setResume}
            onBack={() => setStep("basics")}
            onNext={() => setStep("education")}
          />
        )}
        {step === "education" && (
          <EducationStep
            resume={resume}
            setResume={setResume}
            onBack={() => setStep("experience")}
            onNext={() => setStep("domain")}
          />
        )}
        {step === "domain" && (
          <DomainStep
            resume={resume}
            setResume={setResume}
            targetDomain={targetDomain}
            setTargetDomain={setTargetDomain}
            customCurrentDomain={customCurrentDomain}
            setCustomCurrentDomain={setCustomCurrentDomain}
            customTargetDomain={customTargetDomain}
            setCustomTargetDomain={setCustomTargetDomain}
            questions={domainQs}
            answers={domainAnswers}
            setAnswers={setDomainAnswers}
            onLoad={loadDomainQuestions}
            onBack={() => setStep("education")}
            onSynth={handleSynthesize}
            busy={!!busy}
          />
        )}
        {step === "preview" && (
          <PreviewStep
            resume={resume}
            setResume={setResume}
            template={template}
            setTemplate={setTemplate}
            onBack={() => setStep("domain")}
            onRestart={() => {
              setResume(emptyResume);
              setDomainAnswers({});
              setDomainQs([]);
              navigate({ to: "/builder", search: { mode: "new" } });
              setStep("intro");
            }}
          />
        )}
      </div>
    </main>
  );
}

/* =================== Steps =================== */

function IntroStep({ onNew, onUpload }: { onNew: () => void; onUpload: () => void }) {
  return (
    <div className="max-w-2xl mx-auto text-center pt-12">
      <h1 className="font-display text-4xl font-semibold tracking-tight">Let's start.</h1>
      <p className="mt-3 text-muted-foreground">
        Build from scratch with a guided questionnaire, or upload a resume to reformat or pivot domains.
      </p>
      <div className="mt-8 grid sm:grid-cols-2 gap-4">
        <button
          onClick={onNew}
          className="group text-left p-6 border border-rule rounded-md bg-card hover:border-ink transition"
        >
          <Sparkles className="size-5 mb-3" />
          <div className="font-display font-semibold text-lg">New Resume</div>
          <p className="text-sm text-muted-foreground mt-1">
            Answer questions step by step. AI sharpens your bullets.
          </p>
        </button>
        <button
          onClick={onUpload}
          className="group text-left p-6 border border-rule rounded-md bg-card hover:border-ink transition"
        >
          <UploadIcon className="size-5 mb-3" />
          <div className="font-display font-semibold text-lg">Upload Existing</div>
          <p className="text-sm text-muted-foreground mt-1">
            PDF, DOCX, or TXT. We'll extract, clean, and (optionally) translate to a new domain.
          </p>
        </button>
      </div>
    </div>
  );
}

function UploadStep({
  onFile,
  onSkip,
  busy,
}: {
  onFile: (f: File) => void;
  onSkip: () => void;
  busy: boolean;
}) {
  return (
    <div className="max-w-xl mx-auto pt-12">
      <h2 className="font-display text-3xl font-semibold">Upload your resume</h2>
      <p className="text-muted-foreground mt-2">PDF, DOCX, or TXT — up to a few pages.</p>
      <label className="mt-8 block">
        <div className="border-2 border-dashed border-rule rounded-md p-12 text-center hover:bg-paper-soft transition cursor-pointer">
          <FileText className="size-8 mx-auto text-muted-foreground" />
          <div className="mt-3 font-medium">Click or drop file to upload</div>
          <div className="text-xs text-muted-foreground mt-1">.pdf, .docx, .txt</div>
        </div>
        <input
          type="file"
          accept=".pdf,.docx,.txt,application/pdf,text/plain"
          className="hidden"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
        />
      </label>
      <div className="mt-6 flex justify-between">
        <Link to="/">
          <Button variant="ghost"><ArrowLeft className="mr-1 size-4" /> Home</Button>
        </Link>
        <Button variant="outline" onClick={onSkip}>Skip — start blank</Button>
      </div>
    </div>
  );
}

function StepShell({
  title,
  subtitle,
  children,
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}) {
  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="font-display text-3xl font-semibold tracking-tight">{title}</h2>
      {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
      <div className="mt-8 space-y-5">{children}</div>
      <div className="mt-10 flex justify-between">
        {onBack ? (
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="mr-1 size-4" /> Back
          </Button>
        ) : (
          <span />
        )}
        {onNext && (
          <Button onClick={onNext} disabled={nextDisabled}>
            {nextLabel} <ArrowRight className="ml-1 size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function BasicsStep({
  resume,
  setResume,
  customCurrentDomain,
  setCustomCurrentDomain,
  onNext,
}: {
  resume: ResumeData;
  setResume: (r: ResumeData) => void;
  customCurrentDomain: string;
  setCustomCurrentDomain: (d: string) => void;
  onNext: () => void;
}) {
  const set = <K extends keyof ResumeData>(k: K, v: ResumeData[K]) =>
    setResume({ ...resume, [k]: v });

  // Calculate the select value
  const selectValue = DOMAINS.filter(d => d !== "Other").includes(resume.domain)
    ? resume.domain
    : (resume.domain ? "Other" : "");

  const handleDomainSelectChange = (val: string) => {
    if (val !== "Other") {
      setResume({ ...resume, domain: val });
    } else {
      setResume({ ...resume, domain: customCurrentDomain || "Other" });
    }
  };

  const handleCustomDomainChange = (val: string) => {
    setCustomCurrentDomain(val);
    setResume({ ...resume, domain: val });
  };

  return (
    <StepShell
      title="The basics"
      subtitle="Who you are and how to reach you."
      onNext={onNext}
      nextDisabled={!resume.name || !resume.email}
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Full name *">
          <Input value={resume.name} onChange={(e) => set("name", e.target.value)} placeholder="Avery Chen" />
        </Field>
        <Field label="Headline / Title">
          <Input value={resume.title} onChange={(e) => set("title", e.target.value)} placeholder="Senior Product Designer" />
        </Field>
        <Field label="Email *">
          <Input type="email" value={resume.email} onChange={(e) => set("email", e.target.value)} placeholder="you@domain.com" />
        </Field>
        <Field label="Phone">
          <Input value={resume.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <Field label="Location">
          <Input value={resume.location ?? ""} onChange={(e) => set("location", e.target.value)} placeholder="Berlin, DE" />
        </Field>
        <Field label="Website">
          <Input value={resume.website ?? ""} onChange={(e) => set("website", e.target.value)} placeholder="averychen.com" />
        </Field>
        <Field label="LinkedIn">
          <Input value={resume.linkedin ?? ""} onChange={(e) => set("linkedin", e.target.value)} placeholder="linkedin.com/in/avery" />
        </Field>
        <Field label="Current domain">
          <Select value={selectValue} onValueChange={handleDomainSelectChange}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {DOMAINS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </div>

      {selectValue === "Other" && (
        <div className="mt-4 p-4 border border-rule rounded-md bg-card animate-in fade-in slide-in-from-top-2 duration-200">
          <Field label="Specify your custom domain">
            <Input
              value={customCurrentDomain}
              onChange={(e) => handleCustomDomainChange(e.target.value)}
              placeholder="e.g. QA / Testing, Game Design, Embedded Systems"
            />
          </Field>
        </div>
      )}

      <Field label="Summary (1–3 sentences)">
        <Textarea rows={3} value={resume.summary} onChange={(e) => set("summary", e.target.value)} placeholder="Designer with 8 years..." />
      </Field>
      <Field label="Skills (comma separated)">
        <Input
          value={resume.skills.join(", ")}
          onChange={(e) => set("skills", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
          placeholder="Figma, Design systems, User research"
        />
      </Field>
    </StepShell>
  );
}

function ExperienceStep({
  resume,
  setResume,
  onBack,
  onNext,
}: {
  resume: ResumeData;
  setResume: (r: ResumeData) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const add = () =>
    setResume({
      ...resume,
      experience: [
        ...resume.experience,
        { role: "", company: "", location: "", start: "", end: "", bullets: [""] },
      ],
    });
  const update = (i: number, patch: Partial<ResumeData["experience"][number]>) => {
    const next = [...resume.experience];
    next[i] = { ...next[i], ...patch };
    setResume({ ...resume, experience: next });
  };
  const remove = (i: number) =>
    setResume({ ...resume, experience: resume.experience.filter((_, idx) => idx !== i) });

  return (
    <StepShell
      title="Work experience"
      subtitle="Add your most recent roles. We'll polish the bullets later."
      onBack={onBack}
      onNext={onNext}
    >
      {resume.experience.length === 0 && (
        <p className="text-sm text-muted-foreground italic">No experience yet. Add your first role below.</p>
      )}
      {resume.experience.map((e, i) => (
        <div key={i} className="border border-rule rounded-md p-5 bg-card space-y-3">
          <div className="flex justify-between items-start">
            <div className="font-semibold text-sm">Role #{i + 1}</div>
            <button onClick={() => remove(i)} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="size-4" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Input placeholder="Role" value={e.role} onChange={(ev) => update(i, { role: ev.target.value })} />
            <Input placeholder="Company" value={e.company} onChange={(ev) => update(i, { company: ev.target.value })} />
            <Input placeholder="Location" value={e.location ?? ""} onChange={(ev) => update(i, { location: ev.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Start (Jan 2022)" value={e.start} onChange={(ev) => update(i, { start: ev.target.value })} />
              <Input placeholder="End (Present)" value={e.end} onChange={(ev) => update(i, { end: ev.target.value })} />
            </div>
          </div>
          <Textarea
            rows={4}
            placeholder="One bullet per line. Quick rough notes are fine — AI will rewrite."
            value={e.bullets.join("\n")}
            onChange={(ev) =>
              update(i, { bullets: ev.target.value.split("\n").map((s) => s.replace(/^[-•]\s*/, "")) })
            }
          />
        </div>
      ))}
      <Button variant="outline" onClick={add}><Plus className="mr-1 size-4" /> Add role</Button>
    </StepShell>
  );
}

function EducationStep({
  resume,
  setResume,
  onBack,
  onNext,
}: {
  resume: ResumeData;
  setResume: (r: ResumeData) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const addEdu = () =>
    setResume({
      ...resume,
      education: [...resume.education, { school: "", degree: "", location: "", start: "", end: "", details: "" }],
    });
  const updateEdu = (i: number, patch: Partial<ResumeData["education"][number]>) => {
    const next = [...resume.education];
    next[i] = { ...next[i], ...patch };
    setResume({ ...resume, education: next });
  };
  const removeEdu = (i: number) =>
    setResume({ ...resume, education: resume.education.filter((_, idx) => idx !== i) });

  const addProj = () =>
    setResume({
      ...resume,
      projects: [...resume.projects, { name: "", description: "", tech: "", link: "" }],
    });
  const updateProj = (i: number, patch: Partial<ResumeData["projects"][number]>) => {
    const next = [...resume.projects];
    next[i] = { ...next[i], ...patch };
    setResume({ ...resume, projects: next });
  };
  const removeProj = (i: number) =>
    setResume({ ...resume, projects: resume.projects.filter((_, idx) => idx !== i) });

  return (
    <StepShell title="Education & projects" subtitle="Add what's relevant — leave the rest blank." onBack={onBack} onNext={onNext}>
      <div>
        <h3 className="font-display font-semibold mb-3">Education</h3>
        {resume.education.map((e, i) => (
          <div key={i} className="border border-rule rounded-md p-5 bg-card space-y-3 mb-3">
            <div className="flex justify-between items-start">
              <div className="text-sm font-semibold">Entry #{i + 1}</div>
              <button onClick={() => removeEdu(i)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="size-4" />
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Input placeholder="School" value={e.school} onChange={(ev) => updateEdu(i, { school: ev.target.value })} />
              <Input placeholder="Degree" value={e.degree} onChange={(ev) => updateEdu(i, { degree: ev.target.value })} />
              <Input placeholder="Start" value={e.start} onChange={(ev) => updateEdu(i, { start: ev.target.value })} />
              <Input placeholder="End" value={e.end} onChange={(ev) => updateEdu(i, { end: ev.target.value })} />
            </div>
            <Input placeholder="Details (GPA, honors, coursework)" value={e.details ?? ""} onChange={(ev) => updateEdu(i, { details: ev.target.value })} />
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addEdu}><Plus className="mr-1 size-4" /> Add education</Button>
      </div>

      <div className="pt-2">
        <h3 className="font-display font-semibold mb-3">Projects (optional)</h3>
        {resume.projects.map((p, i) => (
          <div key={i} className="border border-rule rounded-md p-5 bg-card space-y-3 mb-3">
            <div className="flex justify-between items-start">
              <div className="text-sm font-semibold">Project #{i + 1}</div>
              <button onClick={() => removeProj(i)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="size-4" />
              </button>
            </div>
            <Input placeholder="Name" value={p.name} onChange={(ev) => updateProj(i, { name: ev.target.value })} />
            <Textarea rows={2} placeholder="Description" value={p.description} onChange={(ev) => updateProj(i, { description: ev.target.value })} />
            <div className="grid sm:grid-cols-2 gap-3">
              <Input placeholder="Tech / tools" value={p.tech ?? ""} onChange={(ev) => updateProj(i, { tech: ev.target.value })} />
              <Input placeholder="Link" value={p.link ?? ""} onChange={(ev) => updateProj(i, { link: ev.target.value })} />
            </div>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addProj}><Plus className="mr-1 size-4" /> Add project</Button>
      </div>
    </StepShell>
  );
}

function DomainStep({
  resume,
  setResume,
  targetDomain,
  setTargetDomain,
  customCurrentDomain,
  setCustomCurrentDomain,
  customTargetDomain,
  setCustomTargetDomain,
  questions,
  answers,
  setAnswers,
  onLoad,
  onBack,
  onSynth,
  busy,
}: {
  resume: ResumeData;
  setResume: (r: ResumeData) => void;
  targetDomain: Domain;
  setTargetDomain: (d: Domain) => void;
  customCurrentDomain: string;
  setCustomCurrentDomain: (d: string) => void;
  customTargetDomain: string;
  setCustomTargetDomain: (d: string) => void;
  questions: DomainQuestion[];
  answers: Record<string, string>;
  setAnswers: (a: Record<string, string>) => void;
  onLoad: () => void;
  onBack: () => void;
  onSynth: () => void;
  busy: boolean;
}) {
  const currentSelectValue = DOMAINS.filter(d => d !== "Other").includes(resume.domain)
    ? resume.domain
    : (resume.domain ? "Other" : "");

  const targetSelectValue = DOMAINS.filter(d => d !== "Other").includes(targetDomain)
    ? targetDomain
    : (targetDomain ? "Other" : "");

  const handleCurrentSelectChange = (val: string) => {
    if (val !== "Other") {
      setResume({ ...resume, domain: val });
    } else {
      setResume({ ...resume, domain: customCurrentDomain || "Other" });
    }
  };

  const handleCustomCurrentChange = (val: string) => {
    setCustomCurrentDomain(val);
    setResume({ ...resume, domain: val });
  };

  const handleTargetSelectChange = (val: string) => {
    if (val !== "Other") {
      setTargetDomain(val);
    } else {
      setTargetDomain(customTargetDomain || "Other");
    }
  };

  const handleCustomTargetChange = (val: string) => {
    setCustomTargetDomain(val);
    setTargetDomain(val);
  };

  const finalCurrent = resume.domain === "Other" ? customCurrentDomain : resume.domain;
  const finalTarget = targetDomain === "Other" ? customTargetDomain : targetDomain;
  const isPivot = finalTarget !== finalCurrent;

  return (
    <StepShell title="Sharpen for your target domain" subtitle="Pick the field you want this resume to land in." onBack={onBack}>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Current domain">
          <Select value={currentSelectValue} onValueChange={handleCurrentSelectChange}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {DOMAINS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Target domain">
          <Select value={targetSelectValue} onValueChange={handleTargetSelectChange}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {DOMAINS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          {currentSelectValue === "Other" && (
            <div className="mt-2 p-3 border border-rule rounded-md bg-card animate-in fade-in slide-in-from-top-2 duration-200">
              <Field label="Specify your custom current domain">
                <Input
                  value={customCurrentDomain}
                  onChange={(e) => handleCustomCurrentChange(e.target.value)}
                  placeholder="e.g. QA / Testing, Embedded Systems"
                />
              </Field>
            </div>
          )}
        </div>
        <div>
          {targetSelectValue === "Other" && (
            <div className="mt-2 p-3 border border-rule rounded-md bg-card animate-in fade-in slide-in-from-top-2 duration-200">
              <Field label="Specify your custom target domain">
                <Input
                  value={customTargetDomain}
                  onChange={(e) => handleCustomTargetChange(e.target.value)}
                  placeholder="e.g. QA / Testing, Mobile Automation"
                />
              </Field>
            </div>
          )}
        </div>
      </div>

      {isPivot && finalTarget && finalCurrent && (
        <div className="border border-ink rounded-md p-3 text-sm bg-paper-soft">
          Career pivot detected: <strong>{finalCurrent} → {finalTarget}</strong>. AI will reframe
          your experience in the language of the target field.
        </div>
      )}

      <div className="flex items-center justify-between border border-rule rounded-md p-4 bg-card">
        <div>
          <div className="font-semibold">Domain-specific questions</div>
          <div className="text-sm text-muted-foreground">Generate targeted questions to strengthen your resume.</div>
        </div>
        <Button variant="outline" onClick={onLoad} disabled={busy}>
          <Sparkles className="mr-1 size-4" /> Generate questions
        </Button>
      </div>

      {questions.length > 0 && (
        <div className="space-y-4">
          {questions.map((q) => (
            <Field key={q.id} label={q.label}>
              <Textarea
                rows={2}
                placeholder={q.placeholder}
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
              />
            </Field>
          ))}
        </div>
      )}

      <Field label="Certifications (one per line)">
        <Textarea
          rows={2}
          value={(resume.certifications ?? []).join("\n")}
          onChange={(e) =>
            setResume({
              ...resume,
              certifications: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
            })
          }
        />
      </Field>

      <div className="pt-2 flex justify-end">
        <Button size="lg" onClick={onSynth} disabled={busy}>
          {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
          Generate resume
        </Button>
      </div>
    </StepShell>
  );
}

function PreviewStep({
  resume,
  setResume,
  template,
  setTemplate,
  onBack,
  onRestart,
}: {
  resume: ResumeData;
  setResume: React.Dispatch<React.SetStateAction<ResumeData>>;
  template: TemplateId;
  setTemplate: (t: TemplateId) => void;
  onBack: () => void;
  onRestart: () => void;
}) {
  const [spacing, setSpacing] = useState<"compact" | "normal" | "spacious">("normal");
  const [fontSize, setFontSize] = useState<"small" | "medium" | "large">("medium");

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight">Your resume</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Switch templates or export. Drafts saved locally.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onBack}><ArrowLeft className="mr-1 size-4" /> Edit</Button>
          <Button variant="outline" onClick={() => exportDOCX(resume)}>
            <Download className="mr-1 size-4" /> DOCX
          </Button>
          <Button onClick={() => exportPDF(resume, { spacing, fontSize })}>
            <Download className="mr-1 size-4" /> PDF
          </Button>
        </div>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-500 text-xs px-4 py-2.5 rounded-md mb-6 flex items-center gap-2 animate-in fade-in duration-300">
        <span className="text-base">💡</span>
        <div>
          <strong>Pro-tip:</strong> You can edit any text (names, titles, bullet points, skills, etc.) directly by clicking and typing on the resume preview below! Click away when done to save your edits.
        </div>
      </div>

      <div className="grid lg:grid-cols-[220px_1fr] gap-6">
        <aside className="space-y-2">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Template</div>
          {(["minimal", "corporate", "creative"] as TemplateId[]).map((t) => (
            <button
              key={t}
              onClick={() => setTemplate(t)}
              className={`w-full text-left px-3 py-2 rounded-sm text-sm border transition ${
                template === t
                  ? "bg-ink text-paper border-ink"
                  : "bg-card hover:border-ink border-rule"
              }`}
            >
              <div className="font-display font-semibold capitalize">{t}</div>
              <div className={`text-[11px] ${template === t ? "text-paper/70" : "text-muted-foreground"}`}>
                {t === "minimal" && "Editorial, single column"}
                {t === "corporate" && "Bold header band"}
                {t === "creative" && "Sidebar layout"}
              </div>
            </button>
          ))}

          <div className="text-xs uppercase tracking-widest text-muted-foreground mt-4 mb-2 pt-2 border-t border-rule">Spacing</div>
          <div className="flex gap-1 bg-muted p-1 rounded-sm">
            {(["compact", "normal", "spacious"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSpacing(s)}
                className={`w-full text-center py-1 rounded-sm text-xs font-semibold capitalize transition ${
                  spacing === s
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="text-xs uppercase tracking-widest text-muted-foreground mt-4 mb-2">Font Size</div>
          <div className="flex gap-1 bg-muted p-1 rounded-sm">
            {(["small", "medium", "large"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFontSize(f)}
                className={`w-full text-center py-1 rounded-sm text-xs font-semibold capitalize transition ${
                  fontSize === f
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-rule mt-4">
            <Button variant="ghost" size="sm" onClick={onRestart}>Start over</Button>
          </div>
        </aside>

        <div className="bg-paper-soft rounded-md p-6">
          <ResumePreview
            data={resume}
            template={template}
            onUpdate={setResume}
            spacing={spacing}
            fontSize={fontSize}
          />
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{label}</Label>
      {children}
    </div>
  );
}
