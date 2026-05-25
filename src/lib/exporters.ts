import { jsPDF } from "jspdf";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";
import fileSaver from "file-saver";
const saveAs = typeof fileSaver === "function" ? fileSaver : (fileSaver as any).saveAs || (() => {});
import type { ResumeData } from "./resume-types";

export interface ExportOptions {
  spacing?: "compact" | "normal" | "spacious";
  fontSize?: "small" | "medium" | "large";
}

export function exportPDF(r: ResumeData, opts?: ExportOptions) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;
  let y = M;

  const spacing = opts?.spacing ?? "normal";
  const fontOpt = opts?.fontSize ?? "medium";

  const baseSize = fontOpt === "small" ? 9 : fontOpt === "large" ? 11 : 10;
  const titleSize = fontOpt === "small" ? 10 : fontOpt === "large" ? 12 : 11;
  const nameSize = fontOpt === "small" ? 20 : fontOpt === "large" ? 24 : 22;

  const lh = fontOpt === "small" ? 11.5 : fontOpt === "large" ? 14 : 13;
  const sectionGap = spacing === "compact" ? 8 : spacing === "spacious" ? 18 : 14;
  const itemGap = spacing === "compact" ? 3 : spacing === "spacious" ? 8 : 6;
  const lineDrawGap = spacing === "compact" ? 2 : spacing === "spacious" ? 6 : 4;

  const ensure = (h: number) => {
    if (y + h > H - M) {
      doc.addPage();
      y = M;
    }
  };

  const wrap = (text: string, size: number, width: number): string[] => {
    doc.setFontSize(size);
    return doc.splitTextToSize(text, width);
  };

  // Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(nameSize);
  doc.text(r.name || "Your Name", M, y);
  y += nameSize;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(titleSize);
  if (r.title) {
    doc.text(r.title, M, y);
    y += titleSize + itemGap;
  }
  const contact = [r.email, r.phone, r.location, r.website, r.linkedin]
    .filter(Boolean)
    .join("  •  ");
  if (contact) {
    doc.setFontSize(baseSize - 1);
    doc.setTextColor(90);
    doc.text(contact, M, y);
    doc.setTextColor(0);
    y += baseSize + itemGap;
  }
  doc.setDrawColor(180);
  doc.line(M, y, W - M, y);
  y += lineDrawGap + 4;

  const section = (title: string) => {
    ensure(titleSize + sectionGap + 12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(titleSize);
    doc.text(title.toUpperCase(), M, y);
    y += lineDrawGap;
    doc.setDrawColor(180);
    doc.line(M, y, W - M, y);
    y += titleSize + 3;
    doc.setFont("helvetica", "normal");
  };

  if (r.summary) {
    section("Summary");
    const lines = wrap(r.summary, baseSize, W - M * 2);
    doc.setFontSize(baseSize);
    lines.forEach((l) => {
      ensure(lh);
      doc.text(l, M, y);
      y += lh;
    });
    y += itemGap;
  }

  if (r.skills.length) {
    section("Skills");
    const lines = wrap(r.skills.join(" • "), baseSize, W - M * 2);
    doc.setFontSize(baseSize);
    lines.forEach((l) => {
      ensure(lh);
      doc.text(l, M, y);
      y += lh;
    });
    y += itemGap;
  }

  if (r.experience.length) {
    section("Experience");
    r.experience.forEach((e) => {
      ensure(titleSize + lh * 2);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(titleSize);
      doc.text(`${e.role}`, M, y);
      const dates = `${e.start} – ${e.end}`;
      const dw = doc.getTextWidth(dates);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(baseSize);
      doc.text(dates, W - M - dw, y);
      y += lh;
      doc.setFont("helvetica", "italic");
      doc.text(
        `${e.company}${e.location ? " — " + e.location : ""}`,
        M,
        y,
      );
      y += lh - 1;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(baseSize);
      e.bullets.forEach((b) => {
        const lines = wrap(`• ${b}`, baseSize, W - M * 2 - 10);
        lines.forEach((l, i) => {
          ensure(lh);
          doc.text(l, M + (i === 0 ? 0 : 10), y);
          y += lh;
        });
      });
      y += itemGap;
    });
  }

  if (r.projects.length) {
    section("Projects");
    r.projects.forEach((p) => {
      ensure(titleSize + lh);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(titleSize);
      doc.text(p.name, M, y);
      y += lh;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(baseSize);
      const lines = wrap(p.description, baseSize, W - M * 2);
      lines.forEach((l) => {
        ensure(lh);
        doc.text(l, M, y);
        y += lh;
      });
      if (p.tech) {
        ensure(lh);
        doc.setFont("helvetica", "italic");
        doc.text(`Tech: ${p.tech}`, M, y);
        y += lh;
        doc.setFont("helvetica", "normal");
      }
      y += itemGap;
    });
  }

  if (r.education.length) {
    section("Education");
    r.education.forEach((e) => {
      ensure(titleSize + lh * 2);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(titleSize);
      doc.text(e.school, M, y);
      const dates = `${e.start} – ${e.end}`;
      const dw = doc.getTextWidth(dates);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(baseSize);
      doc.text(dates, W - M - dw, y);
      y += lh;
      doc.text(e.degree, M, y);
      y += lh - 1;
      if (e.details) {
        const lines = wrap(e.details, baseSize, W - M * 2);
        lines.forEach((l) => {
          ensure(lh);
          doc.text(l, M, y);
          y += lh;
        });
      }
      y += itemGap;
    });
  }

  const list = (title: string, items?: string[]) => {
    if (!items || !items.length) return;
    section(title);
    doc.setFontSize(baseSize);
    items.forEach((it) => {
      const lines = wrap(`• ${it}`, baseSize, W - M * 2 - 10);
      lines.forEach((l, i) => {
        ensure(lh);
        doc.text(l, M + (i === 0 ? 0 : 10), y);
        y += lh;
      });
    });
    y += itemGap;
  };

  list("Certifications", r.certifications);
  list("Publications", r.publications);
  list("Volunteer", r.volunteer);

  doc.save(`${(r.name || "resume").replace(/\s+/g, "_")}.pdf`);
}

export async function exportDOCX(r: ResumeData) {
  const para = (text: string, opts: Partial<{ bold: boolean; italic: boolean; size: number }> = {}) =>
    new Paragraph({
      children: [new TextRun({ text, bold: opts.bold, italics: opts.italic, size: opts.size ?? 22, font: "Calibri" })],
    });

  const heading = (text: string) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 80 },
      children: [
        new TextRun({ text: text.toUpperCase(), bold: true, size: 24, font: "Calibri" }),
      ],
    });

  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      children: [new TextRun({ text: r.name || "Your Name", bold: true, size: 44, font: "Calibri" })],
    }),
  );
  if (r.title) children.push(para(r.title, { size: 24 }));
  const contact = [r.email, r.phone, r.location, r.website, r.linkedin].filter(Boolean).join("  •  ");
  if (contact) children.push(para(contact, { size: 20, italic: true }));

  if (r.summary) {
    children.push(heading("Summary"));
    children.push(para(r.summary));
  }

  if (r.skills.length) {
    children.push(heading("Skills"));
    children.push(para(r.skills.join(" • ")));
  }

  if (r.experience.length) {
    children.push(heading("Experience"));
    r.experience.forEach((e) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${e.role} — ${e.company}`, bold: true, size: 22, font: "Calibri" }),
            new TextRun({ text: `   ${e.start} – ${e.end}`, italics: true, size: 20, font: "Calibri" }),
          ],
        }),
      );
      if (e.location) children.push(para(e.location, { italic: true, size: 20 }));
      e.bullets.forEach((b) =>
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            children: [new TextRun({ text: b, size: 22, font: "Calibri" })],
          }),
        ),
      );
    });
  }

  if (r.projects.length) {
    children.push(heading("Projects"));
    r.projects.forEach((p) => {
      children.push(para(p.name, { bold: true }));
      children.push(para(p.description));
      if (p.tech) children.push(para(`Tech: ${p.tech}`, { italic: true, size: 20 }));
    });
  }

  if (r.education.length) {
    children.push(heading("Education"));
    r.education.forEach((e) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${e.school} — ${e.degree}`, bold: true, size: 22, font: "Calibri" }),
            new TextRun({ text: `   ${e.start} – ${e.end}`, italics: true, size: 20, font: "Calibri" }),
          ],
        }),
      );
      if (e.details) children.push(para(e.details));
    });
  }

  const listSection = (title: string, items?: string[]) => {
    if (!items || !items.length) return;
    children.push(heading(title));
    items.forEach((it) =>
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [new TextRun({ text: it, size: 22, font: "Calibri" })],
        }),
      ),
    );
  };
  listSection("Certifications", r.certifications);
  listSection("Publications", r.publications);
  listSection("Volunteer", r.volunteer);

  const doc = new Document({
    sections: [
      {
        properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${(r.name || "resume").replace(/\s+/g, "_")}.docx`);
}
