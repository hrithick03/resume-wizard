import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { emptyResume, type ResumeData, type Domain } from "./resume-types";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

async function callGroq(system: string, user: string): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY not configured");

  const models = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "mixtral-8x7b-32768",
  ];

  let lastError: Error | null = null;

  for (const model of models) {
    try {
      const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model,
          temperature: 0.4,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Groq ${res.status}: ${text.slice(0, 200)}`);
      }

      const data = (await res.json()) as {
        choices: Array<{ message: { content: string } }>;
      };
      return data.choices[0]?.message?.content ?? "{}";
    } catch (e) {
      console.warn(`Model ${model} failed, trying next fallback...`, e);
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }

  throw lastError || new Error("Failed to call Groq");
}

function safeJson<T>(s: string, fallback: T): T {
  try {
    return JSON.parse(s) as T;
  } catch {
    const m = s.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]) as T;
      } catch {
        /* ignore */
      }
    }
    return fallback;
  }
}

/* -------------------- Domain Questions -------------------- */

const QUESTIONS_SCHEMA = z.object({
  domain: z.string().min(1),
  existing: z.record(z.string(), z.unknown()).optional(),
});

export const generateDomainQuestions = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => QUESTIONS_SCHEMA.parse(input))
  .handler(async ({ data }) => {
    const system = `You are an expert resume coach. Return JSON with the shape:
{"questions":[{"id":"string","label":"string","placeholder":"string","type":"text|textarea"}]}
Generate 5-7 targeted, specific follow-up questions tailored to the candidate's chosen domain.
Avoid generic items already covered (name, email, education, work history). Focus on domain-specific
skills, signature projects, metrics, tools, and achievements that strengthen the resume.`;

    const user = `Domain: ${data.domain}
Existing info: ${JSON.stringify(data.existing ?? {})}
Return JSON only.`;

    try {
      const raw = await callGroq(system, user);
      const parsed = safeJson<{
        questions: Array<{ id: string; label: string; placeholder?: string; type?: string }>;
      }>(raw, { questions: [] });
      return { questions: parsed.questions ?? [], error: null as string | null };
    } catch (e) {
      return {
        questions: [],
        error: e instanceof Error ? e.message : "Failed to generate questions",
      };
    }
  });

/* -------------------- Resume Synthesis -------------------- */

const SYNTH_SCHEMA = z.object({
  rawAnswers: z.record(z.string(), z.unknown()),
  domain: z.string(),
  targetDomain: z.string().optional(),
  existingResume: z.unknown().optional(),
});

export const synthesizeResume = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SYNTH_SCHEMA.parse(input))
  .handler(async ({ data }) => {
    const system = `You are an elite, world-class executive resume writer and ATS optimization specialist. Output a complete, ATS-optimized resume as STRICT JSON matching this exact shape (no extra keys, no markdown):
{
  "name": string, "title": string, "email": string, "phone": string,
  "location": string, "website": string, "linkedin": string,
  "domain": string, "summary": string,
  "skills": string[],
  "experience": [{"role":string,"company":string,"location":string,"start":string,"end":string,"bullets":string[]}],
  "education": [{"school":string,"degree":string,"location":string,"start":string,"end":string,"details":string}],
  "projects": [{"name":string,"description":string,"tech":string,"link":string}],
  "certifications": string[], "publications": string[], "volunteer": string[]
}
Rules:
- To make the resume look highly professional, substantial, and fill a full page without empty whitespace, you MUST write detailed, fully formed, and comprehensive descriptions and bullet points.
- Rewrite all experience bullet points using strong action verbs + context + measurable impact (e.g., metrics, %, numbers, or quality outcomes) to maximize selection probability. Avoid brief or single-line bullets.
- Generate 5-7 robust, high-impact bullet points per professional experience role. Each bullet should be 20-35 words long, detailing the task, tools used, and business outcome.
- For the skills section, generate a comprehensive list of 12-20 specific technical skills, tools, programming languages, databases, libraries, and methodologies relevant to the target domain (do not list generic/basic skills).
- For each project, write a detailed 2-3 sentence description explaining the architectural design, technologies utilized, and testing/quality outcomes (e.g., test automation coverage, optimization percentage, CI/CD pipeline integration).
- For the education section, populate the 'details' field with relevant coursework, focus areas, key projects, or honors to add academic depth.
- Tailor the wording, skills, headline title, summary, and experience to be 100% optimized for the target domain (e.g., if the target is QA / Testing, heavily emphasize test automation, test cases, bug tracking, Selenium, Cypress, Playwright, JIRA, test coverage, and validation methodologies).
- Translate and reframe past transferable experiences to match the target domain's core responsibilities. For example, frame developer or designer tasks in terms of quality gates, regression testing, user acceptance, requirements analysis, and validation if pivoting to QA/Testing.
- Keep all factual claims grounded in user input (do not invent fake company names, degrees, or employment dates). However, you should rephrase job titles slightly to align with the target domain (e.g. "Software Engineer" to "QA Automation Engineer" or "Software Quality Engineer") if it directly matches the duties performed.
- Fill unknown fields with empty string or empty array.`;

    const user = JSON.stringify({
      sourceDomain: data.domain,
      targetDomain: data.targetDomain ?? data.domain,
      existingResume: data.existingResume ?? null,
      answers: data.rawAnswers,
    });

    try {
      const raw = await callGroq(system, user);
      const parsed = safeJson<Partial<ResumeData>>(raw, {});
      const resume: ResumeData = {
        ...emptyResume,
        ...parsed,
        domain: ((parsed.domain as Domain) ?? data.domain) as Domain,
        skills: Array.isArray(parsed.skills) ? parsed.skills.filter(Boolean) : [],
        experience: (Array.isArray(parsed.experience) ? parsed.experience : [])
          .filter(Boolean)
          .map(e => ({
            role: e?.role || "",
            company: e?.company || "",
            location: e?.location || "",
            start: e?.start || "",
            end: e?.end || "",
            bullets: Array.isArray(e?.bullets) ? e.bullets.filter(Boolean) : [],
          })),
        education: (Array.isArray(parsed.education) ? parsed.education : [])
          .filter(Boolean)
          .map(edu => ({
            school: edu?.school || "",
            degree: edu?.degree || "",
            location: edu?.location || "",
            start: edu?.start || "",
            end: edu?.end || "",
            details: edu?.details || "",
          })),
        projects: (Array.isArray(parsed.projects) ? parsed.projects : [])
          .filter(Boolean)
          .map(p => ({
            name: p?.name || "",
            description: p?.description || "",
            tech: p?.tech || "",
            link: p?.link || "",
          })),
        certifications: Array.isArray(parsed.certifications) ? parsed.certifications.filter(Boolean) : [],
        publications: Array.isArray(parsed.publications) ? parsed.publications.filter(Boolean) : [],
        volunteer: Array.isArray(parsed.volunteer) ? parsed.volunteer.filter(Boolean) : [],
      };
      return { resume, error: null as string | null };
    } catch (e) {
      return {
        resume: null,
        error: e instanceof Error ? e.message : "Failed to generate resume",
      };
    }
  });

/* -------------------- Parse Uploaded Resume -------------------- */

const PARSE_SCHEMA = z.object({
  text: z.string().min(10).max(50000),
});

export const parseResumeText = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => PARSE_SCHEMA.parse(input))
  .handler(async ({ data }) => {
    const system = `Extract structured resume data from raw text. Return STRICT JSON matching:
{
  "name": string, "title": string, "email": string, "phone": string,
  "location": string, "website": string, "linkedin": string,
  "domain": string, "summary": string,
  "skills": string[],
  "experience": [{"role":string,"company":string,"location":string,"start":string,"end":string,"bullets":string[]}],
  "education": [{"school":string,"degree":string,"location":string,"start":string,"end":string,"details":string}],
  "projects": [{"name":string,"description":string,"tech":string,"link":string}],
  "certifications": string[], "publications": string[], "volunteer": string[]
}
Infer a likely "domain" (e.g. Software Engineering, Product Management, Design, Marketing, etc.).
Preserve all facts; do not invent.`;

    try {
      const raw = await callGroq(system, data.text.slice(0, 30000));
      const parsed = safeJson<Partial<ResumeData>>(raw, {});
      const resume: ResumeData = {
        ...emptyResume,
        ...parsed,
        skills: Array.isArray(parsed.skills) ? parsed.skills.filter(Boolean) : [],
        experience: (Array.isArray(parsed.experience) ? parsed.experience : [])
          .filter(Boolean)
          .map(e => ({
            role: e?.role || "",
            company: e?.company || "",
            location: e?.location || "",
            start: e?.start || "",
            end: e?.end || "",
            bullets: Array.isArray(e?.bullets) ? e.bullets.filter(Boolean) : [],
          })),
        education: (Array.isArray(parsed.education) ? parsed.education : [])
          .filter(Boolean)
          .map(edu => ({
            school: edu?.school || "",
            degree: edu?.degree || "",
            location: edu?.location || "",
            start: edu?.start || "",
            end: edu?.end || "",
            details: edu?.details || "",
          })),
        projects: (Array.isArray(parsed.projects) ? parsed.projects : [])
          .filter(Boolean)
          .map(p => ({
            name: p?.name || "",
            description: p?.description || "",
            tech: p?.tech || "",
            link: p?.link || "",
          })),
        certifications: Array.isArray(parsed.certifications) ? parsed.certifications.filter(Boolean) : [],
        publications: Array.isArray(parsed.publications) ? parsed.publications.filter(Boolean) : [],
        volunteer: Array.isArray(parsed.volunteer) ? parsed.volunteer.filter(Boolean) : [],
      };
      return { resume, error: null as string | null };
    } catch (e) {
      return {
        resume: null,
        error: e instanceof Error ? e.message : "Failed to parse resume",
      };
    }
  });
