export type TemplateId = "minimal" | "corporate" | "creative";

export type Domain = string;

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

export const emptyResume: ResumeData = {
  name: "",
  title: "",
  email: "",
  phone: "",
  location: "",
  website: "",
  linkedin: "",
  domain: "Software Engineering",
  summary: "",
  skills: [],
  experience: [],
  education: [],
  projects: [],
  certifications: [],
  publications: [],
  volunteer: [],
};

export const DOMAINS: Domain[] = [
  "Software Engineering",
  "Product Management",
  "Data / AI / ML",
  "Design (UX/UI/Visual)",
  "Marketing",
  "Finance",
  "Sales",
  "QA / Testing",
  "Other",
];
