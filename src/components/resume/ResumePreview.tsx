import type { ResumeData, TemplateId } from "@/lib/resume-types";

interface Props {
  data: ResumeData;
  template: TemplateId;
  onUpdate?: (data: ResumeData) => void;
  spacing?: "compact" | "normal" | "spacious";
  fontSize?: "small" | "medium" | "large";
}

const editableClass = "hover:bg-muted/20 focus:bg-muted/40 focus:ring-1 focus:ring-ring focus:outline-none rounded px-0.5 -mx-0.5 transition-colors cursor-text";

export function ResumePreview({ data: rawData, template, onUpdate, spacing = "normal", fontSize = "medium" }: Props) {
  // Ensure all arrays and optional fields are safely defaulted to prevent any runtime rendering crashes
  const data: ResumeData = {
    name: rawData?.name || "",
    title: rawData?.title || "",
    email: rawData?.email || "",
    phone: rawData?.phone || "",
    location: rawData?.location || "",
    website: rawData?.website || "",
    linkedin: rawData?.linkedin || "",
    domain: rawData?.domain || "",
    summary: rawData?.summary || "",
    skills: Array.isArray(rawData?.skills) ? rawData.skills : [],
    experience: (Array.isArray(rawData?.experience) ? rawData.experience : []).map(e => ({
      role: e?.role || "",
      company: e?.company || "",
      location: e?.location || "",
      start: e?.start || "",
      end: e?.end || "",
      bullets: Array.isArray(e?.bullets) ? e.bullets : [],
    })),
    education: (Array.isArray(rawData?.education) ? rawData.education : []).map(edu => ({
      school: edu?.school || "",
      degree: edu?.degree || "",
      location: edu?.location || "",
      start: edu?.start || "",
      end: edu?.end || "",
      details: edu?.details || "",
    })),
    projects: (Array.isArray(rawData?.projects) ? rawData.projects : []).map(p => ({
      name: p?.name || "",
      description: p?.description || "",
      tech: p?.tech || "",
      link: p?.link || "",
    })),
    certifications: Array.isArray(rawData?.certifications) ? rawData.certifications : [],
    publications: Array.isArray(rawData?.publications) ? rawData.publications : [],
    volunteer: Array.isArray(rawData?.volunteer) ? rawData.volunteer : [],
  };

  if (template === "corporate") return <Corporate data={data} onUpdate={onUpdate} spacing={spacing} fontSize={fontSize} />;
  if (template === "creative") return <Creative data={data} onUpdate={onUpdate} spacing={spacing} fontSize={fontSize} />;
  return <Minimal data={data} onUpdate={onUpdate} spacing={spacing} fontSize={fontSize} />;
}

function Contact({
  data,
  onUpdate,
  isEditable,
}: {
  data: ResumeData;
  onUpdate?: (d: ResumeData) => void;
  isEditable: boolean;
}) {
  const fields = [
    { key: "email", val: data.email, label: "email" },
    { key: "phone", val: data.phone, label: "phone" },
    { key: "location", val: data.location, label: "location" },
    { key: "website", val: data.website, label: "website" },
    { key: "linkedin", val: data.linkedin, label: "linkedin" },
  ] as const;

  const activeFields = fields.filter((f) => f.val || isEditable);

  return (
    <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
      {activeFields.map((f, idx) => (
        <span key={f.key} className="flex items-center gap-2">
          <span
            contentEditable={isEditable}
            suppressContentEditableWarning
            onBlur={(e) => {
              onUpdate?.({ ...data, [f.key]: e.currentTarget.innerText.trim() });
            }}
            className={isEditable ? editableClass : ""}
          >
            {f.val || `[add ${f.label}]`}
          </span>
          {idx < activeFields.length - 1 && <span className="opacity-40">•</span>}
        </span>
      ))}
    </div>
  );
}

function SectionTitle({ children, spacing = "normal" }: { children: React.ReactNode; spacing?: "compact" | "normal" | "spacious" }) {
  const marginClass =
    spacing === "compact"
      ? "mt-3 mb-1"
      : spacing === "spacious"
        ? "mt-7 mb-3"
        : "mt-5 mb-2";
  return (
    <h3 className={`font-display text-[11px] font-semibold tracking-[0.18em] uppercase pb-1 border-b border-rule ${marginClass}`}>
      {children}
    </h3>
  );
}

/* -------- Minimal -------- */
function Minimal({
  data,
  onUpdate,
  spacing = "normal",
  fontSize = "medium",
}: {
  data: ResumeData;
  onUpdate?: (d: ResumeData) => void;
  spacing?: "compact" | "normal" | "spacious";
  fontSize?: "small" | "medium" | "large";
}) {
  const isEditable = !!onUpdate;

  const fontClass =
    fontSize === "small"
      ? "text-[12px] leading-normal"
      : fontSize === "large"
        ? "text-[14px] leading-relaxed"
        : "text-[13px] leading-relaxed";

  const itemMargin =
    spacing === "compact"
      ? "mb-1.5"
      : spacing === "spacious"
        ? "mb-4"
        : "mb-3";

  const listSpacing =
    spacing === "compact"
      ? "space-y-0"
      : spacing === "spacious"
        ? "space-y-1"
        : "space-y-0.5";

  return (
    <article className={`bg-card text-ink p-10 shadow-sm rounded-md ${fontClass}`}>
      <header>
        <h2
          contentEditable={isEditable}
          suppressContentEditableWarning
          onBlur={(e) => onUpdate?.({ ...data, name: e.currentTarget.innerText.trim() })}
          className={`font-display text-3xl font-semibold tracking-tight ${isEditable ? editableClass : ""}`}
        >
          {data.name || "Your Name"}
        </h2>
        {data.title && (
          <p
            contentEditable={isEditable}
            suppressContentEditableWarning
            onBlur={(e) => onUpdate?.({ ...data, title: e.currentTarget.innerText.trim() })}
            className={`text-sm mt-0.5 ${isEditable ? editableClass : ""}`}
          >
            {data.title}
          </p>
        )}
        <div className="mt-2">
          <Contact data={data} onUpdate={onUpdate} isEditable={isEditable} />
        </div>
      </header>

      {data.summary && (
        <>
          <SectionTitle spacing={spacing}>Summary</SectionTitle>
          <p
            contentEditable={isEditable}
            suppressContentEditableWarning
            onBlur={(e) => onUpdate?.({ ...data, summary: e.currentTarget.innerText.trim() })}
            className={isEditable ? editableClass : ""}
          >
            {data.summary}
          </p>
        </>
      )}

      {data.skills.length > 0 && (
        <>
          <SectionTitle spacing={spacing}>Skills</SectionTitle>
          <p
            contentEditable={isEditable}
            suppressContentEditableWarning
            onBlur={(e) => {
              const parts = e.currentTarget.innerText.split(/•|·|,/).map(s => s.trim()).filter(Boolean);
              onUpdate?.({ ...data, skills: parts });
            }}
            className={isEditable ? editableClass : ""}
          >
            {data.skills.join(" • ")}
          </p>
        </>
      )}

      {data.experience.length > 0 && (
        <>
          <SectionTitle spacing={spacing}>Experience</SectionTitle>
          {data.experience.map((e, i) => (
            <div key={i} className={itemMargin}>
              <div className="flex justify-between gap-3">
                <div
                  contentEditable={isEditable}
                  suppressContentEditableWarning
                  onBlur={(eVal) => {
                    const newExp = [...data.experience];
                    newExp[i] = { ...newExp[i], role: eVal.currentTarget.innerText.trim() };
                    onUpdate?.({ ...data, experience: newExp });
                  }}
                  className={`font-semibold ${isEditable ? editableClass : ""}`}
                >
                  {e.role}
                </div>
                <div
                  contentEditable={isEditable}
                  suppressContentEditableWarning
                  onBlur={(eVal) => {
                    const newExp = [...data.experience];
                    const parts = eVal.currentTarget.innerText.split(/–|-/).map(s => s.trim());
                    newExp[i] = { ...newExp[i], start: parts[0] || "", end: parts[1] || "" };
                    onUpdate?.({ ...data, experience: newExp });
                  }}
                  className={`text-xs text-muted-foreground whitespace-nowrap ${isEditable ? editableClass : ""}`}
                >
                  {e.start} – {e.end}
                </div>
              </div>
              <div className="italic text-[12px] flex flex-wrap gap-1">
                <span
                  contentEditable={isEditable}
                  suppressContentEditableWarning
                  onBlur={(eVal) => {
                    const newExp = [...data.experience];
                    newExp[i] = { ...newExp[i], company: eVal.currentTarget.innerText.trim() };
                    onUpdate?.({ ...data, experience: newExp });
                  }}
                  className={isEditable ? editableClass : ""}
                >
                  {e.company}
                </span>
                <span> — </span>
                <span
                  contentEditable={isEditable}
                  suppressContentEditableWarning
                  onBlur={(eVal) => {
                    const newExp = [...data.experience];
                    newExp[i] = { ...newExp[i], location: eVal.currentTarget.innerText.trim() };
                    onUpdate?.({ ...data, experience: newExp });
                  }}
                  className={isEditable ? editableClass : ""}
                >
                  {e.location || "Remote"}
                </span>
              </div>
              <ul className={`list-disc pl-5 mt-1 ${listSpacing}`}>
                {e.bullets.map((b, j) => (
                  <li
                    key={j}
                    contentEditable={isEditable}
                    suppressContentEditableWarning
                    onBlur={(eVal) => {
                      const newExp = [...data.experience];
                      const newBullets = [...newExp[i].bullets];
                      newBullets[j] = eVal.currentTarget.innerText.trim();
                      newExp[i] = { ...newExp[i], bullets: newBullets };
                      onUpdate?.({ ...data, experience: newExp });
                    }}
                    className={isEditable ? editableClass : ""}
                  >
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </>
      )}

      {data.projects.length > 0 && (
        <>
          <SectionTitle spacing={spacing}>Projects</SectionTitle>
          {data.projects.map((p, i) => (
            <div key={i} className={itemMargin}>
              <div
                contentEditable={isEditable}
                suppressContentEditableWarning
                onBlur={(eVal) => {
                  const newProj = [...data.projects];
                  newProj[i] = { ...newProj[i], name: eVal.currentTarget.innerText.trim() };
                  onUpdate?.({ ...data, projects: newProj });
                }}
                className={`font-semibold ${isEditable ? editableClass : ""}`}
              >
                {p.name}
              </div>
              <div
                contentEditable={isEditable}
                suppressContentEditableWarning
                onBlur={(eVal) => {
                  const newProj = [...data.projects];
                  newProj[i] = { ...newProj[i], description: eVal.currentTarget.innerText.trim() };
                  onUpdate?.({ ...data, projects: newProj });
                }}
                className={isEditable ? editableClass : ""}
              >
                {p.description}
              </div>
              {p.tech && (
                <div className="italic text-[12px] flex gap-1">
                  <span>Tech:</span>
                  <span
                    contentEditable={isEditable}
                    suppressContentEditableWarning
                    onBlur={(eVal) => {
                      const newProj = [...data.projects];
                      newProj[i] = { ...newProj[i], tech: eVal.currentTarget.innerText.trim() };
                      onUpdate?.({ ...data, projects: newProj });
                    }}
                    className={isEditable ? editableClass : ""}
                  >
                    {p.tech}
                  </span>
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {data.education.length > 0 && (
        <>
          <SectionTitle spacing={spacing}>Education</SectionTitle>
          {data.education.map((e, i) => (
            <div key={i} className={itemMargin}>
              <div className="flex justify-between gap-3">
                <div
                  contentEditable={isEditable}
                  suppressContentEditableWarning
                  onBlur={(eVal) => {
                    const newEdu = [...data.education];
                    newEdu[i] = { ...newEdu[i], school: eVal.currentTarget.innerText.trim() };
                    onUpdate?.({ ...data, education: newEdu });
                  }}
                  className={`font-semibold ${isEditable ? editableClass : ""}`}
                >
                  {e.school}
                </div>
                <div
                  contentEditable={isEditable}
                  suppressContentEditableWarning
                  onBlur={(eVal) => {
                    const newEdu = [...data.education];
                    const parts = eVal.currentTarget.innerText.split(/–|-/).map(s => s.trim());
                    newEdu[i] = { ...newEdu[i], start: parts[0] || "", end: parts[1] || "" };
                    onUpdate?.({ ...data, education: newEdu });
                  }}
                  className={`text-xs text-muted-foreground whitespace-nowrap ${isEditable ? editableClass : ""}`}
                >
                  {e.start} – {e.end}
                </div>
              </div>
              <div
                contentEditable={isEditable}
                suppressContentEditableWarning
                onBlur={(eVal) => {
                  const newEdu = [...data.education];
                  newEdu[i] = { ...newEdu[i], degree: eVal.currentTarget.innerText.trim() };
                  onUpdate?.({ ...data, education: newEdu });
                }}
                className={isEditable ? editableClass : ""}
              >
                {e.degree}
              </div>
              {e.details && (
                <div
                  contentEditable={isEditable}
                  suppressContentEditableWarning
                  onBlur={(eVal) => {
                    const newEdu = [...data.education];
                    newEdu[i] = { ...newEdu[i], details: eVal.currentTarget.innerText.trim() };
                    onUpdate?.({ ...data, education: newEdu });
                  }}
                  className={`text-[12px] ${isEditable ? editableClass : ""}`}
                >
                  {e.details}
                </div>
              )}
            </div>
          ))}
        </>
      )}

      <ListBlock
        title="Certifications"
        items={data.certifications}
        spacing={spacing}
        isEditable={isEditable}
        listSpacing={listSpacing}
        onUpdateField={(items) => onUpdate?.({ ...data, certifications: items })}
      />
      <ListBlock
        title="Publications"
        items={data.publications}
        spacing={spacing}
        isEditable={isEditable}
        listSpacing={listSpacing}
        onUpdateField={(items) => onUpdate?.({ ...data, publications: items })}
      />
      <ListBlock
        title="Volunteer"
        items={data.volunteer}
        spacing={spacing}
        isEditable={isEditable}
        listSpacing={listSpacing}
        onUpdateField={(items) => onUpdate?.({ ...data, volunteer: items })}
      />
    </article>
  );
}

/* -------- Corporate (two-column header band) -------- */
function Corporate({
  data,
  onUpdate,
  spacing = "normal",
  fontSize = "medium",
}: {
  data: ResumeData;
  onUpdate?: (d: ResumeData) => void;
  spacing?: "compact" | "normal" | "spacious";
  fontSize?: "small" | "medium" | "large";
}) {
  const isEditable = !!onUpdate;

  const fontClass =
    fontSize === "small"
      ? "text-[12px] leading-normal"
      : fontSize === "large"
        ? "text-[14px] leading-relaxed"
        : "text-[13px] leading-relaxed";

  const itemMargin =
    spacing === "compact"
      ? "mb-1.5"
      : spacing === "spacious"
        ? "mb-4"
        : "mb-3";

  const listSpacing =
    spacing === "compact"
      ? "space-y-0"
      : spacing === "spacious"
        ? "space-y-1"
        : "space-y-0.5";

  return (
    <article className={`bg-card text-ink shadow-sm rounded-md overflow-hidden ${fontClass}`}>
      <div className="bg-ink text-paper px-10 py-7">
        <h2
          contentEditable={isEditable}
          suppressContentEditableWarning
          onBlur={(e) => onUpdate?.({ ...data, name: e.currentTarget.innerText.trim() })}
          className={`font-display text-3xl font-semibold tracking-tight ${isEditable ? editableClass : ""}`}
        >
          {data.name || "Your Name"}
        </h2>
        {data.title && (
          <p
            contentEditable={isEditable}
            suppressContentEditableWarning
            onBlur={(e) => onUpdate?.({ ...data, title: e.currentTarget.innerText.trim() })}
            className={`text-sm opacity-80 mt-1 ${isEditable ? editableClass : ""}`}
          >
            {data.title}
          </p>
        )}
        <div className="text-xs opacity-70 mt-3 flex flex-wrap gap-x-3 gap-y-1">
          {[
            { key: "email", val: data.email, label: "email" },
            { key: "phone", val: data.phone, label: "phone" },
            { key: "location", val: data.location, label: "location" },
            { key: "website", val: data.website, label: "website" },
            { key: "linkedin", val: data.linkedin, label: "linkedin" },
          ].map((f, idx, arr) => {
            if (!f.val && !isEditable) return null;
            return (
              <span key={f.key} className="flex items-center gap-1.5">
                <span
                  contentEditable={isEditable}
                  suppressContentEditableWarning
                  onBlur={(e) => onUpdate?.({ ...data, [f.key]: e.currentTarget.innerText.trim() })}
                  className={isEditable ? editableClass : ""}
                >
                  {f.val || `[add ${f.label}]`}
                </span>
                {idx < arr.filter(x => x.val || isEditable).length - 1 && <span>•</span>}
              </span>
            );
          })}
        </div>
      </div>
      <div className="p-10">
        {data.summary && (
          <>
            <SectionTitle spacing={spacing}>Profile</SectionTitle>
            <p
              contentEditable={isEditable}
              suppressContentEditableWarning
              onBlur={(e) => onUpdate?.({ ...data, summary: e.currentTarget.innerText.trim() })}
              className={isEditable ? editableClass : ""}
            >
              {data.summary}
            </p>
          </>
        )}
        {data.skills.length > 0 && (
          <>
            <SectionTitle spacing={spacing}>Core Competencies</SectionTitle>
            <div className="flex flex-wrap gap-1.5">
              {data.skills.map((s, i) => (
                <span
                  key={i}
                  contentEditable={isEditable}
                  suppressContentEditableWarning
                  onBlur={(eVal) => {
                    const newSkills = [...data.skills];
                    newSkills[i] = eVal.currentTarget.innerText.trim();
                    onUpdate?.({ ...data, skills: newSkills.filter(Boolean) });
                  }}
                  className={`text-[11px] px-2 py-0.5 border border-rule rounded ${isEditable ? editableClass : ""}`}
                >
                  {s}
                </span>
              ))}
            </div>
          </>
        )}
        {data.experience.length > 0 && (
          <>
            <SectionTitle spacing={spacing}>Professional Experience</SectionTitle>
            {data.experience.map((e, i) => (
              <div key={i} className={itemMargin}>
                <div className="flex justify-between gap-3">
                  <div className="font-semibold flex flex-wrap gap-1">
                    <span
                      contentEditable={isEditable}
                      suppressContentEditableWarning
                      onBlur={(eVal) => {
                        const newExp = [...data.experience];
                        newExp[i] = { ...newExp[i], role: eVal.currentTarget.innerText.trim() };
                        onUpdate?.({ ...data, experience: newExp });
                      }}
                      className={isEditable ? editableClass : ""}
                    >
                      {e.role}
                    </span>
                    <span className="font-normal">—</span>
                    <span
                      contentEditable={isEditable}
                      suppressContentEditableWarning
                      onBlur={(eVal) => {
                        const newExp = [...data.experience];
                        newExp[i] = { ...newExp[i], company: eVal.currentTarget.innerText.trim() };
                        onUpdate?.({ ...data, experience: newExp });
                      }}
                      className={`font-normal ${isEditable ? editableClass : ""}`}
                    >
                      {e.company}
                    </span>
                  </div>
                  <div
                    contentEditable={isEditable}
                    suppressContentEditableWarning
                    onBlur={(eVal) => {
                      const newExp = [...data.experience];
                      const parts = eVal.currentTarget.innerText.split(/–|-/).map(s => s.trim());
                      newExp[i] = { ...newExp[i], start: parts[0] || "", end: parts[1] || "" };
                      onUpdate?.({ ...data, experience: newExp });
                    }}
                    className={`text-xs text-muted-foreground whitespace-nowrap ${isEditable ? editableClass : ""}`}
                  >
                    {e.start} – {e.end}
                  </div>
                </div>
                <ul className={`list-disc pl-5 mt-1 ${listSpacing}`}>
                  {e.bullets.map((b, j) => (
                    <li
                      key={j}
                      contentEditable={isEditable}
                      suppressContentEditableWarning
                      onBlur={(eVal) => {
                        const newExp = [...data.experience];
                        const newBullets = [...newExp[i].bullets];
                        newBullets[j] = eVal.currentTarget.innerText.trim();
                        newExp[i] = { ...newExp[i], bullets: newBullets };
                        onUpdate?.({ ...data, experience: newExp });
                      }}
                      className={isEditable ? editableClass : ""}
                    >
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </>
        )}
        {data.education.length > 0 && (
          <>
            <SectionTitle spacing={spacing}>Education</SectionTitle>
            {data.education.map((e, i) => (
              <div key={i} className={itemMargin}>
                <div className="flex justify-between gap-3">
                  <div
                    contentEditable={isEditable}
                    suppressContentEditableWarning
                    onBlur={(eVal) => {
                      const newEdu = [...data.education];
                      newEdu[i] = { ...newEdu[i], school: eVal.currentTarget.innerText.trim() };
                      onUpdate?.({ ...data, education: newEdu });
                    }}
                    className={`font-semibold ${isEditable ? editableClass : ""}`}
                  >
                    {e.school}
                  </div>
                  <div
                    contentEditable={isEditable}
                    suppressContentEditableWarning
                    onBlur={(eVal) => {
                      const newEdu = [...data.education];
                      const parts = eVal.currentTarget.innerText.split(/–|-/).map(s => s.trim());
                      newEdu[i] = { ...newEdu[i], start: parts[0] || "", end: parts[1] || "" };
                      onUpdate?.({ ...data, education: newEdu });
                    }}
                    className={`text-xs text-muted-foreground ${isEditable ? editableClass : ""}`}
                  >
                    {e.start} – {e.end}
                  </div>
                </div>
                <div
                  contentEditable={isEditable}
                  suppressContentEditableWarning
                  onBlur={(eVal) => {
                    const newEdu = [...data.education];
                    newEdu[i] = { ...newEdu[i], degree: eVal.currentTarget.innerText.trim() };
                    onUpdate?.({ ...data, education: newEdu });
                  }}
                  className={isEditable ? editableClass : ""}
                >
                  {e.degree}
                </div>
              </div>
            ))}
          </>
        )}
        {data.projects.length > 0 && (
          <>
            <SectionTitle spacing={spacing}>Notable Projects</SectionTitle>
            {data.projects.map((p, i) => (
              <div key={i} className={itemMargin}>
                <div
                  contentEditable={isEditable}
                  suppressContentEditableWarning
                  onBlur={(eVal) => {
                    const newProj = [...data.projects];
                    newProj[i] = { ...newProj[i], name: eVal.currentTarget.innerText.trim() };
                    onUpdate?.({ ...data, projects: newProj });
                  }}
                  className={`font-semibold ${isEditable ? editableClass : ""}`}
                >
                  {p.name}
                </div>
                <div
                  contentEditable={isEditable}
                  suppressContentEditableWarning
                  onBlur={(eVal) => {
                    const newProj = [...data.projects];
                    newProj[i] = { ...newProj[i], description: eVal.currentTarget.innerText.trim() };
                    onUpdate?.({ ...data, projects: newProj });
                  }}
                  className={isEditable ? editableClass : ""}
                >
                  {p.description}
                </div>
              </div>
            ))}
          </>
        )}
        <ListBlock
          title="Certifications"
          items={data.certifications}
          spacing={spacing}
          isEditable={isEditable}
          listSpacing={listSpacing}
          onUpdateField={(items) => onUpdate?.({ ...data, certifications: items })}
        />
        <ListBlock
          title="Publications"
          items={data.publications}
          spacing={spacing}
          isEditable={isEditable}
          listSpacing={listSpacing}
          onUpdateField={(items) => onUpdate?.({ ...data, publications: items })}
        />
      </div>
    </article>
  );
}

/* -------- Creative (left sidebar) -------- */
function Creative({
  data,
  onUpdate,
  spacing = "normal",
  fontSize = "medium",
}: {
  data: ResumeData;
  onUpdate?: (d: ResumeData) => void;
  spacing?: "compact" | "normal" | "spacious";
  fontSize?: "small" | "medium" | "large";
}) {
  const isEditable = !!onUpdate;

  const fontClass =
    fontSize === "small"
      ? "text-[12px] leading-normal"
      : fontSize === "large"
        ? "text-[14px] leading-relaxed"
        : "text-[13px] leading-relaxed";

  const itemMargin =
    spacing === "compact"
      ? "mb-1.5"
      : spacing === "spacious"
        ? "mb-4"
        : "mb-3";

  const listSpacing =
    spacing === "compact"
      ? "space-y-0"
      : spacing === "spacious"
        ? "space-y-1"
        : "space-y-0.5";

  return (
    <article className={`bg-card text-ink shadow-sm rounded-md overflow-hidden grid grid-cols-[200px_1fr] ${fontClass}`}>
      <aside className="bg-paper-soft p-6 text-[12px] border-r border-rule">
        <h2
          contentEditable={isEditable}
          suppressContentEditableWarning
          onBlur={(e) => onUpdate?.({ ...data, name: e.currentTarget.innerText.trim() })}
          className={`font-display text-xl font-bold leading-tight ${isEditable ? editableClass : ""}`}
        >
          {data.name || "Your Name"}
        </h2>
        {data.title && (
          <p
            contentEditable={isEditable}
            suppressContentEditableWarning
            onBlur={(e) => onUpdate?.({ ...data, title: e.currentTarget.innerText.trim() })}
            className={`text-[11px] mt-1 mb-4 italic ${isEditable ? editableClass : ""}`}
          >
            {data.title}
          </p>
        )}
        <div className="space-y-1 mb-5 text-[11px]">
          {[
            { key: "email", val: data.email, label: "email" },
            { key: "phone", val: data.phone, label: "phone" },
            { key: "location", val: data.location, label: "location" },
            { key: "website", val: data.website, label: "website" },
            { key: "linkedin", val: data.linkedin, label: "linkedin" },
          ].map((f) => {
            if (!f.val && !isEditable) return null;
            return (
              <div
                key={f.key}
                contentEditable={isEditable}
                suppressContentEditableWarning
                onBlur={(e) => onUpdate?.({ ...data, [f.key]: e.currentTarget.innerText.trim() })}
                className={`break-words ${isEditable ? editableClass : ""}`}
              >
                {f.val || `[add ${f.label}]`}
              </div>
            );
          })}
        </div>
        {data.skills.length > 0 && (
          <>
            <h3 className="font-display text-[10px] font-bold tracking-widest uppercase mb-2">
              Skills
            </h3>
            <div className="space-y-1">
              {data.skills.map((s, i) => (
                <div
                  key={i}
                  contentEditable={isEditable}
                  suppressContentEditableWarning
                  onBlur={(eVal) => {
                    const newSkills = [...data.skills];
                    newSkills[i] = eVal.currentTarget.innerText.trim();
                    onUpdate?.({ ...data, skills: newSkills.filter(Boolean) });
                  }}
                  className={isEditable ? editableClass : ""}
                >
                  {s}
                </div>
              ))}
            </div>
          </>
        )}
        {data.certifications && data.certifications.length > 0 && (
          <>
            <h3 className="font-display text-[10px] font-bold tracking-widest uppercase mt-4 mb-2">
              Certifications
            </h3>
            <div className="space-y-1">
              {data.certifications.map((c, i) => (
                <div
                  key={i}
                  contentEditable={isEditable}
                  suppressContentEditableWarning
                  onBlur={(eVal) => {
                    const newCerts = [...(data.certifications || [])];
                    newCerts[i] = eVal.currentTarget.innerText.trim();
                    onUpdate?.({ ...data, certifications: newCerts.filter(Boolean) });
                  }}
                  className={isEditable ? editableClass : ""}
                >
                  {c}
                </div>
              ))}
            </div>
          </>
        )}
      </aside>
      <div className="p-7">
        {data.summary && (
          <>
            <SectionTitle spacing={spacing}>About</SectionTitle>
            <p
              contentEditable={isEditable}
              suppressContentEditableWarning
              onBlur={(e) => onUpdate?.({ ...data, summary: e.currentTarget.innerText.trim() })}
              className={isEditable ? editableClass : ""}
            >
              {data.summary}
            </p>
          </>
        )}
        {data.experience.length > 0 && (
          <>
            <SectionTitle spacing={spacing}>Experience</SectionTitle>
            {data.experience.map((e, i) => (
              <div key={i} className={itemMargin}>
                <div
                  contentEditable={isEditable}
                  suppressContentEditableWarning
                  onBlur={(eVal) => {
                    const newExp = [...data.experience];
                    newExp[i] = { ...newExp[i], role: eVal.currentTarget.innerText.trim() };
                    onUpdate?.({ ...data, experience: newExp });
                  }}
                  className={`font-semibold ${isEditable ? editableClass : ""}`}
                >
                  {e.role}
                </div>
                <div className="italic text-[12px] flex flex-wrap gap-1.5 items-center">
                  <span
                    contentEditable={isEditable}
                    suppressContentEditableWarning
                    onBlur={(eVal) => {
                      const newExp = [...data.experience];
                      newExp[i] = { ...newExp[i], company: eVal.currentTarget.innerText.trim() };
                      onUpdate?.({ ...data, experience: newExp });
                    }}
                    className={isEditable ? editableClass : ""}
                  >
                    {e.company}
                  </span>
                  <span>·</span>
                  <span
                    contentEditable={isEditable}
                    suppressContentEditableWarning
                    onBlur={(eVal) => {
                      const newExp = [...data.experience];
                      const parts = eVal.currentTarget.innerText.split(/–|-/).map(s => s.trim());
                      newExp[i] = { ...newExp[i], start: parts[0] || "", end: parts[1] || "" };
                      onUpdate?.({ ...data, experience: newExp });
                    }}
                    className={isEditable ? editableClass : ""}
                  >
                    {e.start} – {e.end}
                  </span>
                </div>
                <ul className={`list-disc pl-5 mt-1 ${listSpacing}`}>
                  {e.bullets.map((b, j) => (
                    <li
                      key={j}
                      contentEditable={isEditable}
                      suppressContentEditableWarning
                      onBlur={(eVal) => {
                        const newExp = [...data.experience];
                        const newBullets = [...newExp[i].bullets];
                        newBullets[j] = eVal.currentTarget.innerText.trim();
                        newExp[i] = { ...newExp[i], bullets: newBullets };
                        onUpdate?.({ ...data, experience: newExp });
                      }}
                      className={isEditable ? editableClass : ""}
                    >
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </>
        )}
        {data.projects.length > 0 && (
          <>
            <SectionTitle spacing={spacing}>Selected Work</SectionTitle>
            {data.projects.map((p, i) => (
              <div key={i} className={itemMargin}>
                <div
                  contentEditable={isEditable}
                  suppressContentEditableWarning
                  onBlur={(eVal) => {
                    const newProj = [...data.projects];
                    newProj[i] = { ...newProj[i], name: eVal.currentTarget.innerText.trim() };
                    onUpdate?.({ ...data, projects: newProj });
                  }}
                  className={`font-semibold ${isEditable ? editableClass : ""}`}
                >
                  {p.name}
                </div>
                <div
                  contentEditable={isEditable}
                  suppressContentEditableWarning
                  onBlur={(eVal) => {
                    const newProj = [...data.projects];
                    newProj[i] = { ...newProj[i], description: eVal.currentTarget.innerText.trim() };
                    onUpdate?.({ ...data, projects: newProj });
                  }}
                  className={isEditable ? editableClass : ""}
                >
                  {p.description}
                </div>
              </div>
            ))}
          </>
        )}
        {data.education.length > 0 && (
          <>
            <SectionTitle spacing={spacing}>Education</SectionTitle>
            {data.education.map((e, i) => (
              <div key={i} className={itemMargin}>
                <div
                  contentEditable={isEditable}
                  suppressContentEditableWarning
                  onBlur={(eVal) => {
                    const newEdu = [...data.education];
                    newEdu[i] = { ...newEdu[i], school: eVal.currentTarget.innerText.trim() };
                    onUpdate?.({ ...data, education: newEdu });
                  }}
                  className={`font-semibold ${isEditable ? editableClass : ""}`}
                >
                  {e.school}
                </div>
                <div className="text-[12px] flex flex-wrap gap-1.5">
                  <span
                    contentEditable={isEditable}
                    suppressContentEditableWarning
                    onBlur={(eVal) => {
                      const newEdu = [...data.education];
                      newEdu[i] = { ...newEdu[i], degree: eVal.currentTarget.innerText.trim() };
                      onUpdate?.({ ...data, education: newEdu });
                    }}
                    className={isEditable ? editableClass : ""}
                  >
                    {e.degree}
                  </span>
                  <span>·</span>
                  <span
                    contentEditable={isEditable}
                    suppressContentEditableWarning
                    onBlur={(eVal) => {
                      const newEdu = [...data.education];
                      const parts = eVal.currentTarget.innerText.split(/–|-/).map(s => s.trim());
                      newEdu[i] = { ...newEdu[i], start: parts[0] || "", end: parts[1] || "" };
                      onUpdate?.({ ...data, education: newEdu });
                    }}
                    className={isEditable ? editableClass : ""}
                  >
                    {e.start} – {e.end}
                  </span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </article>
  );
}

function ListBlock({
  title,
  items,
  spacing,
  isEditable,
  listSpacing,
  onUpdateField,
}: {
  title: string;
  items?: string[];
  spacing?: "compact" | "normal" | "spacious";
  isEditable: boolean;
  listSpacing: string;
  onUpdateField: (items: string[]) => void;
}) {
  if (!items || (!items.length && !isEditable)) return null;
  return (
    <>
      <SectionTitle spacing={spacing}>{title}</SectionTitle>
      <ul className={`list-disc pl-5 ${listSpacing}`}>
        {(items || []).map((i, idx) => (
          <li
            key={idx}
            contentEditable={isEditable}
            suppressContentEditableWarning
            onBlur={(e) => {
              const newItems = [...(items || [])];
              newItems[idx] = e.currentTarget.innerText.trim();
              onUpdateField(newItems.filter(Boolean));
            }}
            className={isEditable ? editableClass : ""}
          >
            {i}
          </li>
        ))}
        {isEditable && (
          <li
            onClick={() => {
              onUpdateField([...(items || []), "New Item"]);
            }}
            className="text-xs text-muted-foreground cursor-pointer hover:underline list-none mt-1"
          >
            + Add item
          </li>
        )}
      </ul>
    </>
  );
}
