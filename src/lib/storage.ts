import type { ResumeData, TemplateId } from "./resume-types";
import { emptyResume } from "./resume-types";

const KEY = "resume-builder:v1";

export interface PersistedState {
  resume: ResumeData;
  template: TemplateId;
}

export function loadState(): PersistedState {
  if (typeof window === "undefined") {
    return { resume: emptyResume, template: "minimal" };
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { resume: emptyResume, template: "minimal" };
    const parsed = JSON.parse(raw) as PersistedState;
    return {
      resume: { ...emptyResume, ...parsed.resume },
      template: parsed.template ?? "minimal",
    };
  } catch {
    return { resume: emptyResume, template: "minimal" };
  }
}

export function saveState(state: PersistedState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function clearState() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
