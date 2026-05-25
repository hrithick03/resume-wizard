# Architecture & Implementation Guide

Inkwell utilizes **TanStack Start**, a full-stack React framework built on top of Vite and Nitro. This allows client components to securely query server-side APIs via type-safe server functions.

---

## Workspace Directory Structure

```
Resume Wizard/
├── .lovable/                 # Sandbox and configuration logs
├── docs/                     # Project memory and reference docs (this folder)
├── src/
│   ├── components/
│   │   ├── resume/
│   │   │   └── ResumePreview.tsx   # Renders Minimal, Corporate, and Creative layouts
│   │   └── ui/                     # Radix UI + shadcn components
│   ├── hooks/
│   │   └── use-mobile.tsx          # Hook to detect mobile viewports
│   ├── lib/
│   │   ├── error-capture.ts        # Listeners for SSR/client errors
│   │   ├── error-page.ts           # HTML fallback template for fatal errors
│   │   ├── exporters.ts            # Client-side PDF (jsPDF) and DOCX (docx) compilers
│   │   ├── file-parser.ts          # Client-side PDF, DOCX, and TXT parsing
│   │   ├── groq.functions.ts       # Server functions integrating with Groq API
│   │   ├── resume-types.ts         # TypeScript interfaces and data models
│   │   ├── storage.ts              # LocalStorage load/save helpers
│   │   └── utils.ts                # Tailwind class merging utility
│   ├── routes/
│   │   ├── __root.tsx              # Root route shell, providers, and error boundaries
│   │   ├── builder.tsx             # Interactive resume builder (multi-step form)
│   │   └── index.tsx               # Splash/landing page
│   ├── routeTree.gen.ts            # Auto-generated routing tree
│   ├── router.tsx                  # TanStack Router instance configuration
│   ├── server.ts                   # Custom server fetch wrapper with SSR error recovery
│   ├── start.ts                    # Client entry point configuration
│   └── styles.css                  # Tailwind imports and theme definition
├── bun.lock                        # Lockfile for Bun package manager
├── package.json                    # Dependencies, scripts, and devDependencies
├── tsconfig.json                   # TypeScript project configuration
├── vite.config.ts                  # Vite + TanStack Start configuration
└── wrangler.jsonc                  # Cloudflare deployment settings
```

---

## Key architectural Patterns

### 1. Client-Server Functions (`useServerFn`)
* Security is handled by declaring server actions inside `src/lib/groq.functions.ts`. 
* Server functions (e.g., `generateDomainQuestions`, `parseResumeText`, `synthesizeResume`) are compiled to POST endpoints during build time.
* This keeps sensitive keys like `GROQ_API_KEY` completely on the server-side, preventing leakage to the client.

### 2. State & Persistence
* The main state is managed inside `src/routes/builder.tsx` using React `useState`.
* To prevent data loss across page refreshes, the app syncs the `ResumeData` and `TemplateId` to `localStorage` using two `useEffect` hooks in the builder component (`loadState` on mount and `saveState` on modifications).
* The storage logic is encapsulated in `src/lib/storage.ts`.

### 3. Client-Side Parsers & Exporters
* To maintain privacy and speed, heavy parsing and exporting are done directly in the client browser:
  * **Text Extraction**: Read file as array buffer -> parse using `mammoth` (for DOCX) or `pdfjs-dist` (for PDF).
  * **Exporting**: Build a document tree via `docx` or draw text commands via `jspdf`, triggering a local download prompt using `file-saver`.

### 4. Custom SSR Error Capture Wrapper
* Server-side rendering (SSR) frameworks can occasionally fail during hydration or initial render. 
* To prevent the user from seeing a generic or broken screen, Inkwell implements a custom error boundary:
  * `src/lib/error-capture.ts` catches global and unhandled promise rejections on the server, saving the stack trace temporarily with a 5-second TTL.
  * `src/server.ts` intercepts responses from Nitro (h3 server). If it returns a standard 500 error, the wrapper retrieves the captured stack trace, logs it to the console, and serves a branded fallback HTML error page (`src/lib/error-page.ts`).
  * If a route-level error occurs in the React application, the `errorComponent` in `src/routes/__root.tsx` handles it gracefully with a "Try again" button.
