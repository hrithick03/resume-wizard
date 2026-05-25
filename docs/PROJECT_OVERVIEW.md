# Project Overview: Inkwell

Inkwell is a premium, privacy-first, AI-powered interactive resume builder designed to help candidates build clean, ATS-friendly resumes. The application is built using **TanStack Start** (React 19, Vite, TypeScript) and styled with a custom **Paper & Ink** theme powered by **TailwindCSS v4**.

---

## Core Concept
Unlike traditional resume builders that rely on rigid, overdesigned templates, Inkwell focuses on content quality and domain-appropriate language. It assists users through a guided questionnaire and uses LLMs to rewrite, reformat, and optimize experience bullets for specific target fields or career transitions.

## Key Features

### 1. Multi-path Initialization
* **Start From Scratch**: A step-by-step guided questionnaire covering contact info, work experience, education, and projects.
* **Upload Existing Resume**: Accepts `.pdf`, `.docx`, or `.txt` formats. The file content is parsed locally using client-side libraries and sent to the LLM backend for structured data extraction.

### 2. Domain-Aware Questionnaires
* Inkwell supports various career domains:
  * Software Engineering
  * Product Management
  * Data / AI / ML
  * Design (UX/UI/Visual)
  * Marketing
  * Finance
  * Sales
  * Other
* When a target domain is selected, the application generates a set of 5-7 customized, domain-specific questions to extract relevant achievements, metrics, tools, and methodologies that recruiters in that specific field prioritize.

### 3. AI-Powered Bullet Point Refinement & Career Pivots
* Under the hood, Inkwell integrates with the **Groq API** (using the `llama-3.3-70b-versatile` model).
* It rewrites user experience bullet points using strong action verbs, keeping statements under 28 words while emphasizing quantifiable impact.
* If a career pivot is detected (e.g., *Marketing → Product Management*), the LLM automatically reframes the candidate's transferrable skills in the vocabulary of the target domain.

### 4. Custom Resume Layouts (Templates)
Inkwell offers three distinct, clean, and ATS-compliant styles:
1. **Minimal**: Editorial, single-column layout.
2. **Corporate**: Bold header band with a two-column contact section.
3. **Creative**: Split layout with a left sidebar for personal details, skills, and certifications.

### 5. Seamless Multi-Format Exports
* **PDF Export**: Generates pixel-perfect PDFs client-side using `jspdf`.
* **DOCX Export**: Generates fully editable Word documents client-side using the `docx` library.

### 6. Local-Only & Privacy-First
* User data is saved directly to `localStorage`.
* There are no user accounts, database backends, or analytics tracking.
* All data remains local to the user's browser, transmitting text to Groq only during active resume parsing, question generation, and synthesis tasks.
