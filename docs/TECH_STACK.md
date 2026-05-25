# Technology Stack Reference

Inkwell is powered by a modern, high-performance web development stack centered around React 19, TanStack Start, and TailwindCSS v4.

---

## Core Framework & Routing
* **React 19**: Employs React 19 features (e.g., improved server-component/client-component boundaries, resource loading hooks).
* **Vite 7**: Fast building and HMR (Hot Module Replacement) server.
* **TanStack Start**: Full-stack framework leveraging Nitro for serverless deployments.
* **TanStack Router**: Type-safe routing engine. Route configurations are located in `src/routes/` and compiled dynamically to `src/routeTree.gen.ts`.
* **TanStack Query (React Query)**: Manage server state fetching and caching for the client.

## Styling & Design System
* **TailwindCSS v4**: Next-generation utility-first framework that compiles in-CSS configurations instead of using `tailwind.config.js`.
  * **Imports**: Standard components are loaded from `@import "tailwindcss" source(none);`.
  * **Theme Configuration**: The design system custom tokens are configured directly in `src/styles.css` using the `@theme inline` block.
  * **Typography**:
    * **Display font**: `Space Grotesk` (headings, logo, tracking-tight).
    * **Sans-serif font**: `DM Sans` (body copy, inputs, forms).
  * **Harmonious Palette**: Uses advanced `oklch` color definitions for a warm **Paper & Ink** style:
    * `--paper`: Warm cream background (`oklch(0.965 0.008 85)`).
    * `--paper-soft`: Slightly darker accent cream (`oklch(0.935 0.010 80)`).
    * `--ink`: Near black for high-contrast typography (`oklch(0.18 0 0)`).
    * `--ink-soft`: Soft black for secondary elements (`oklch(0.30 0 0)`).
    * `--rule`: Thin separator color (`oklch(0.85 0.010 80)`).
  * **Paper Grain Texture**: A custom utility class `.paper-grain` adds a subtle radial gradient dot matrix pattern to sections of the landing page.

## Backend & AI Integration
* **Groq API**: High-speed inference provider.
* **LLM Model**: `llama-3.3-70b-versatile` — selected for its high reasoning capabilities, fast response times, and compliance with complex JSON schemas.
* **Server Environment**: Requires `GROQ_API_KEY` to be defined in `.env` or system environment variables. The API is queried securely inside server functions.

## Supporting Libraries
* **zod**: Type-safe validation library. Used to parse search query parameters (`searchSchema` in `builder.tsx`) and validate payloads sent to server functions (`QUESTIONS_SCHEMA`, `SYNTH_SCHEMA`, and `PARSE_SCHEMA` in `groq.functions.ts`).
* **docx**: Dynamic generation of Office Open XML (.docx) files client-side.
* **jspdf**: Client-side PDF generation.
* **mammoth**: DOCX-to-HTML/Text extractor. Used for converting uploaded resume Word files into raw text.
* **pdfjs-dist**: PDF-to-Text extractor. Leverages a bundled web worker (`pdf.worker.min.mjs`) to perform asynchronous PDF parsing in the browser background thread.
* **file-saver**: Utility to prompt downloads for local blobs (PDF/DOCX) across all major browsers.
* **lucide-react**: Lightweight icon package.
* **Radix UI**: Accessible primitives (Accordion, Alert Dialog, Aspect Ratio, Avatar, Checkbox, Dropdown, Menu, etc.) styled via custom Tailwind wrappers.
