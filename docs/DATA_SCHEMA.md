# Data Schema & Types Reference

This document maps out the core data schemas, type definitions, and validator boundaries of the Inkwell project.

---

## 1. Resume Data Interface
The primary state of the resume builder is captured by the `ResumeData` interface defined in `src/lib/resume-types.ts`:

```typescript
export interface ResumeData {
  name: string;
  title: string;
  email: string;
  phone?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  domain: Domain;
  summary: string;
  skills: string[];
  experience: ExperienceItem[];
  education: EducationItem[];
  projects: ProjectItem[];
  certifications?: string[];
  publications?: string[];
  volunteer?: string[];
}

export interface ExperienceItem {
  role: string;
  company: string;
  location?: string;
  start: string;
  end: string;
  bullets: string[];
}

export interface EducationItem {
  school: string;
  degree: string;
  location?: string;
  start: string;
  end: string;
  details?: string;
}

export interface ProjectItem {
  name: string;
  description: string;
  tech?: string;
  link?: string;
}
```

---

## 2. Core Constants

### Template Identifiers
The system supports three templates:
```typescript
export type TemplateId = "minimal" | "corporate" | "creative";
```

### Career Domains
Predefined domains are configured in the `DOMAINS` array:
```typescript
export type Domain =
  | "Software Engineering"
  | "Product Management"
  | "Data / AI / ML"
  | "Design (UX/UI/Visual)"
  | "Marketing"
  | "Finance"
  | "Sales"
  | "Other";
```

---

## 3. Server-Side Validation Schemas (Zod)
Zod schemas validate structural inputs inside `src/lib/groq.functions.ts` to ensure consistency and guard against bad API calls.

### Domain Question Request Schema
Validates the payload requesting customized questions:
```typescript
const QUESTIONS_SCHEMA = z.object({
  domain: z.string().min(1),
  existing: z.record(z.string(), z.unknown()).optional(),
});
```

### Resume Synthesis Request Schema
Validates the structured resume build payload:
```typescript
const SYNTH_SCHEMA = z.object({
  rawAnswers: z.record(z.string(), z.unknown()),
  domain: z.string(),
  targetDomain: z.string().optional(),
  existingResume: z.unknown().optional(),
});
```

### Resume Extraction Text Schema
Validates input text extracted from uploaded resume files:
```typescript
const PARSE_SCHEMA = z.object({
  text: z.string().min(10).max(50000),
});
```

---

## 4. LocalStorage Schema
The state is persisted under the key `"resume-builder:v1"` matching the structure:
```typescript
export interface PersistedState {
  resume: ResumeData;
  template: TemplateId;
}
```
* On mount, `loadState()` loads the state from local storage. If key/value pair is missing, it falls back to `emptyResume` and the `"minimal"` template.
