import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { FileText, Sparkles, Upload, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "Inkwell — AI Resume Builder for any domain" },
      {
        name: "description",
        content:
          "Build clean, ATS-friendly resumes by answering smart questions. Upload an existing resume, pivot domains, export to PDF or DOCX.",
      },
      { property: "og:title", content: "Inkwell — AI Resume Builder" },
      {
        property: "og:description",
        content:
          "Interactive, domain-aware resume builder powered by AI. Local-only, private, fast.",
      },
    ],
  }),
});

function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground paper-grain">
      <div className="mx-auto max-w-6xl px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-sm bg-ink" />
          <span className="font-display text-lg font-semibold tracking-tight">Inkwell</span>
        </div>
        <Link to="/builder" search={{ mode: "new" }}>
          <Button variant="ghost" size="sm" className="font-medium">
            Open builder <ArrowRight className="ml-1 size-4" />
          </Button>
        </Link>
      </div>

      <section className="mx-auto max-w-6xl px-6 pt-12 pb-20 grid md:grid-cols-[1.1fr_1fr] gap-12 items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-5">
            A resume, written like a person — not a template
          </p>
          <h1 className="font-display text-5xl md:text-6xl font-semibold leading-[1.02] tracking-tight">
            Answer a few questions.<br />
            Walk away with a resume.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl">
            Inkwell asks the right questions for your domain, rewrites your story with strong
            verbs and measurable impact, and exports a clean ATS-friendly PDF or DOCX. Switching
            careers? Hand it your old resume — we'll translate.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/builder" search={{ mode: "new" }}>
              <Button size="lg" className="font-medium">
                <Sparkles className="mr-2 size-4" /> Start from scratch
              </Button>
            </Link>
            <Link to="/builder" search={{ mode: "upload" }}>
              <Button size="lg" variant="outline" className="font-medium">
                <Upload className="mr-2 size-4" /> Upload existing
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Drafts saved locally in your browser. No account required.
          </p>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 bg-paper-soft rounded-lg rotate-1" />
          <div className="relative bg-card border border-rule rounded-md p-8 shadow-sm font-display">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold">Avery Chen</h3>
              <FileText className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Senior Product Designer</p>
            <div className="mt-4 border-t border-rule pt-3 text-[11px] uppercase tracking-widest font-semibold">
              Experience
            </div>
            <div className="mt-2 font-sans text-[13px] space-y-1">
              <div className="flex justify-between">
                <span className="font-semibold">Design Lead — Northwind</span>
                <span className="text-muted-foreground text-xs">2022 – Now</span>
              </div>
              <ul className="list-disc pl-5 text-muted-foreground space-y-0.5">
                <li>Shipped onboarding redesign that lifted activation by 34%.</li>
                <li>Built a 60-component design system used across 4 product teams.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-rule">
        <div className="mx-auto max-w-6xl px-6 py-16 grid md:grid-cols-3 gap-10">
          {[
            {
              t: "Domain-aware questions",
              d: "Pick a target field and the AI asks for the metrics, tools, and signals that recruiters in that domain actually look for.",
            },
            {
              t: "Pivot careers",
              d: "Upload an old resume and tell us where you're going — Inkwell rewrites your experience in the language of your next role.",
            },
            {
              t: "Three honest templates",
              d: "Minimal, Corporate, Creative. All ATS-friendly. Export to PDF or DOCX with one click.",
            },
          ].map((f) => (
            <div key={f.t}>
              <h3 className="font-display text-xl font-semibold">{f.t}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-rule">
        <div className="mx-auto max-w-6xl px-6 py-6 text-xs text-muted-foreground flex justify-between">
          <span>© Inkwell</span>
          <span>Local-only · Private by default</span>
        </div>
      </footer>
    </main>
  );
}
