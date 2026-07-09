/**
 * syllabusExport.js — Export functions for Generate Syllabus (Phase 1)
 *
 * Converts the structured syllabus sections (from the generate-syllabus
 * edge function) into .docx download and browser-print PDF.
 *
 * Uses the same docx library + printPdf pattern as the rest of KlasUp.
 */
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  BorderStyle, Table, TableRow, TableCell, WidthType, ShadingType,
} from "docx";

// ── Constants ────────────────────────────────────────────────
const TEAL = "0B8A8A";
const TEAL_BRIGHT = "0FB5B5";
const NAVY = "0F1F3D";
const GRAY = "4A5568";
const LIGHT_TEAL_BG = "F0FAFA";
const PLACEHOLDER_COLOR = "8B5CF6"; // purple-ish — stands out clearly

// ── Markdown-ish content parser ──────────────────────────────
// The AI returns content with light markdown: ## sub-headings, **bold**,
// | table rows |, - bullet items. We parse these into docx elements.

function parseContentToDocxChildren(content) {
  const lines = content.split("\n");
  const children = [];
  let tableRows = [];
  let inTable = false;

  function flushTable() {
    if (tableRows.length === 0) return;
    children.push(buildTable(tableRows));
    tableRows = [];
    inTable = false;
  }

  for (const line of lines) {
    const trimmed = line.trim();

    // Blank line
    if (!trimmed) {
      if (inTable) flushTable();
      children.push(new Paragraph({ spacing: { after: 80 } }));
      continue;
    }

    // Table row (pipe-separated)
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      // Skip separator rows like |---|---|
      if (/^\|[\s\-:]+\|/.test(trimmed) && !trimmed.replace(/[\s|:\-]/g, "")) {
        continue;
      }
      const cells = trimmed.slice(1, -1).split("|").map(c => c.trim());
      tableRows.push(cells);
      inTable = true;
      continue;
    }

    // If we were in a table and hit a non-table line, flush
    if (inTable) flushTable();

    // Sub-heading (## or ###)
    const headingMatch = trimmed.match(/^#{2,3}\s+(.+)/);
    if (headingMatch) {
      children.push(new Paragraph({
        children: [new TextRun({ text: headingMatch[1], bold: true, size: 24, color: NAVY, font: "Calibri" })],
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 100 },
      }));
      continue;
    }

    // Bullet point (- or •)
    if (/^[-•●]\s/.test(trimmed)) {
      const bulletText = trimmed.replace(/^[-•●]\s+/, "");
      children.push(new Paragraph({
        children: parseInlineFormatting(bulletText),
        bullet: { level: 0 },
        spacing: { after: 60 },
      }));
      continue;
    }

    // Numbered list
    if (/^\d+[\.\)]\s/.test(trimmed)) {
      children.push(new Paragraph({
        children: parseInlineFormatting(trimmed),
        bullet: { level: 0 },
        spacing: { after: 60 },
      }));
      continue;
    }

    // Default paragraph
    children.push(new Paragraph({
      children: parseInlineFormatting(trimmed),
      spacing: { after: 80 },
    }));
  }

  if (inTable) flushTable();
  return children;
}

// Parse **bold** and [placeholder] inline formatting into TextRun arrays
function parseInlineFormatting(text) {
  const runs = [];
  // Split on **bold** and [placeholder] patterns
  const regex = /(\*\*[^*]+\*\*)|(\[[^\]]+\])/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Text before this match
    if (match.index > lastIndex) {
      runs.push(new TextRun({ text: text.slice(lastIndex, match.index), size: 22, font: "Calibri" }));
    }

    if (match[1]) {
      // **bold**
      const boldText = match[1].slice(2, -2);
      runs.push(new TextRun({ text: boldText, bold: true, size: 22, font: "Calibri" }));
    } else if (match[2]) {
      // [placeholder] — italic + purple color to stand out
      runs.push(new TextRun({
        text: match[2],
        italics: true,
        size: 22,
        font: "Calibri",
        color: PLACEHOLDER_COLOR,
        highlight: "yellow",
      }));
    }

    lastIndex = regex.lastIndex;
  }

  // Remaining text
  if (lastIndex < text.length) {
    runs.push(new TextRun({ text: text.slice(lastIndex), size: 22, font: "Calibri" }));
  }

  // If no runs were created (plain text with no formatting)
  if (runs.length === 0) {
    runs.push(new TextRun({ text, size: 22, font: "Calibri" }));
  }

  return runs;
}

// Build a docx table from parsed rows
function buildTable(rows) {
  const tealBg = { type: ShadingType.SOLID, color: TEAL_BRIGHT };
  const lightBg = { type: ShadingType.SOLID, color: LIGHT_TEAL_BG };

  const tableRows = rows.map((cells, rowIdx) =>
    new TableRow({
      children: cells.map(cell =>
        new TableCell({
          children: [new Paragraph({
            children: parseInlineFormatting(cell),
            spacing: { after: 40 },
            run: rowIdx === 0 ? { bold: true, size: 20, color: "FFFFFF", font: "Calibri" } : undefined,
          })],
          shading: rowIdx === 0 ? tealBg : rowIdx % 2 === 1 ? lightBg : undefined,
          width: { size: Math.floor(100 / cells.length), type: WidthType.PERCENTAGE },
        })
      ),
    })
  );

  return new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

// ── DOCX export ──────────────────────────────────────────────
export async function exportSyllabusDocx(sections, courseName, semesterCode) {
  if (typeof gtag === "function") gtag("event", "export_clicked", { export_type: "syllabus_docx" });

  const children = [
    // Title
    new Paragraph({
      children: [new TextRun({ text: courseName || "Course Syllabus", bold: true, size: 36, color: NAVY, font: "Calibri" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
    }),
    // Subtitle (semester)
    new Paragraph({
      children: [new TextRun({ text: semesterCode || "Syllabus", italics: true, size: 22, color: GRAY, font: "Calibri" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    // Generated-by line
    new Paragraph({
      children: [new TextRun({ text: "Generated by KlasUp", italics: true, size: 16, color: GRAY, font: "Calibri" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: TEAL_BRIGHT } },
    }),
    // Placeholder instruction note
    new Paragraph({
      children: [new TextRun({
        text: 'Sections in [brackets] are for you to fill in or delete. They appear in purple highlight so you can spot them easily.',
        italics: true, size: 20, font: "Calibri", color: GRAY,
      })],
      spacing: { after: 300 },
    }),
  ];

  // Render each section
  for (const section of sections) {
    // Section heading
    children.push(new Paragraph({
      children: [new TextRun({ text: section.title, bold: true, size: 28, color: NAVY, font: "Calibri" })],
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 360, after: 140 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: TEAL_BRIGHT } },
    }));

    // Section content — parse markdown-ish formatting
    const contentChildren = parseContentToDocxChildren(section.content || "");
    children.push(...contentChildren);
  }

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 22 } },
        heading2: { run: { bold: true, size: 28, color: NAVY, font: "Calibri" } },
        heading3: { run: { bold: true, size: 24, color: NAVY, font: "Calibri" } },
      },
    },
    sections: [{
      properties: {
        page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } },
      },
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${(courseName || "syllabus").replace(/\s+/g, "-")}-syllabus.docx`;
  a.click();
}

// ── PDF export (browser print) ───────────────────────────────
export function printSyllabusPdf(sections, courseName, semesterCode) {
  if (typeof gtag === "function") gtag("event", "export_clicked", { export_type: "syllabus_pdf" });

  // Convert sections to styled HTML
  const sectionHtml = sections.map(section => {
    // Convert markdown-ish content to HTML
    const contentHtml = (section.content || "")
      .split("\n")
      .map(line => {
        const trimmed = line.trim();
        if (!trimmed) return "<br>";

        // Sub-heading
        const headingMatch = trimmed.match(/^#{2,3}\s+(.+)/);
        if (headingMatch) return `<h3>${headingMatch[1]}</h3>`;

        // Table row
        if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
          if (/^\|[\s\-:]+\|/.test(trimmed) && !trimmed.replace(/[\s|:\-]/g, "")) return "";
          const cells = trimmed.slice(1, -1).split("|").map(c => c.trim());
          return `<tr>${cells.map(c => `<td>${formatInlineHtml(c)}</td>`).join("")}</tr>`;
        }

        // Bullet
        if (/^[-•●]\s/.test(trimmed)) {
          return `<li>${formatInlineHtml(trimmed.replace(/^[-•●]\s+/, ""))}</li>`;
        }

        // Numbered
        if (/^\d+[\.\)]\s/.test(trimmed)) {
          return `<li>${formatInlineHtml(trimmed)}</li>`;
        }

        return `<p>${formatInlineHtml(trimmed)}</p>`;
      })
      .join("\n");

    // Wrap consecutive <tr> in <table>, consecutive <li> in <ul>
    const wrapped = contentHtml
      .replace(/((?:<tr>.*<\/tr>\n?)+)/g, '<table>$1</table>')
      .replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');

    return `<h2>${escapeHtml(section.title)}</h2>${wrapped}`;
  }).join("\n");

  const html = `
    <div class="header">
      <h1>${escapeHtml(courseName || "Course Syllabus")}</h1>
      <div class="faculty">${escapeHtml(semesterCode || "Syllabus")}</div>
      <div class="date">Generated by KlasUp</div>
    </div>
    <p style="font-style:italic;color:#666;font-size:12px;margin-bottom:24px;">
      Sections in [brackets] are for you to fill in or delete.
    </p>
    ${sectionHtml}
  `;

  const w = window.open("", "_blank");
  w.document.write(`<html><head><title>${escapeHtml(courseName || "Syllabus")} — KlasUp</title>
<style>
  @page { margin: 0.75in; @bottom-center { content: "Page " counter(page); font-size: 9px; color: #999; } }
  body { font-family: 'Manrope', 'Segoe UI', sans-serif; max-width: 720px; margin: 0 auto; padding: 20px 0; line-height: 1.7; color: #0F1F3D; font-size: 14px; }
  h1, h2, h3 { font-family: 'Bricolage Grotesque', 'Arial Black', sans-serif; color: #0F1F3D; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  h2 { font-size: 17px; border-bottom: 2px solid #0FB5B5; padding-bottom: 4px; margin-top: 28px; }
  h3 { font-size: 15px; margin-top: 16px; color: #333; }
  .header { text-align: center; border-bottom: 2px solid #0FB5B5; padding-bottom: 16px; margin-bottom: 24px; }
  .header .faculty { font-size: 13px; color: #4A5568; }
  .header .date { font-size: 11px; color: #999; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  th { background: #0FB5B5; color: #fff; text-align: left; padding: 6px 10px; font-size: 12px; }
  td { border-bottom: 1px solid #eee; padding: 6px 10px; font-size: 13px; }
  tr:first-child td { background: #0FB5B5; color: #fff; font-weight: bold; font-size: 12px; }
  tr:nth-child(even) td { background: #F0FAFA; }
  .footer { text-align: center; font-size: 10px; color: #999; margin-top: 40px; border-top: 1px solid #eee; padding-top: 10px; }
  ul { margin: 4px 0; padding-left: 18px; }
  li { margin: 3px 0; }
  .placeholder { color: #8B5CF6; font-style: italic; background: #FEFCE8; padding: 1px 3px; border-radius: 3px; }
</style></head><body>${html}<div class="footer">Generated by KlasUp · ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div></body></html>`);
  w.document.close();
  w.print();
}

// Format inline markdown → HTML (**bold**, [placeholder])
function formatInlineHtml(text) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]/g, '<span class="placeholder">[$1]</span>');
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
