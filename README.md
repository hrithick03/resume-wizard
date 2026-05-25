# Inkwell — AI-Powered Interactive Resume Builder

Inkwell is a premium, privacy-first, domain-aware resume builder that helps candidates craft high-impact, ATS-friendly resumes. By answering tailored questions, candidates can refine their story, rewrite experience bullets, or pivot career domains with the assistance of AI.

---

## 🚀 Getting Started

### Prerequisites
* [Bun](https://bun.sh) (recommended) or [Node.js](https://nodejs.org) (v18+)

### Installation
Clone the repository and install the dependencies:
```bash
# Using Bun (recommended)
bun install

# Or using npm
npm install
```

### Environment Configuration
Copy or create a `.env` file in the root of the project and add your Groq API key:
```env
GROQ_API_KEY=your-groq-api-key-here
```

### Running Development Server
Run the local dev server:
```bash
# Using Bun
bun dev

# Or using npm
npm run dev
```
Open `http://localhost:3000` (or the port outputted in the shell) to view the application.

---

## 🛠️ Project Documentation & Reference

Detailed documentation of the application architecture, schemas, styling guidelines, and stack configuration is saved inside the `docs/` folder:

1. **[Project Overview](docs/PROJECT_OVERVIEW.md)**: Core features, user paths, domain list, and layout templates.
2. **[Architecture & Implementation](docs/ARCHITECTURE.md)**: Workspace file structure, Server Functions, local storage management, and custom SSR error boundaries.
3. **[Technology Stack](docs/TECH_STACK.md)**: Framework (React 19, TanStack Start/Router), CSS (TailwindCSS v4), AI models, and parsing/exporting engines.
4. **[Data Schema & Types Reference](docs/DATA_SCHEMA.md)**: Core TypeScript interfaces, Zod request validators, and localStorage schema.

---

## 🌟 Key Technology Highlights
* **Full-Stack Framework**: React 19 + TanStack Start.
* **Styling**: TailwindCSS v4 with a custom **Paper & Ink** theme (`oklch` colors).
* **LLM Engine**: Groq API powered by the `llama-3.3-70b-versatile` model.
* **Client-side Processing**: PDF parsing via `pdfjs-dist`, DOCX parsing via `mammoth`, PDF generation via `jspdf`, and DOCX compiling via `docx`.
* **Privacy-First**: No database. All state is maintained in client-side `localStorage`.
