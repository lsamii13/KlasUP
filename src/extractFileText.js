import mammoth from "mammoth";

export default async function extractFileText(file) {
  const ext = file.name.split(".").pop().toLowerCase();

  if (ext === "txt") {
    return await file.text();
  }

  if (ext === "docx") {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }

  if (ext === "pptx") {
    // PPTX is a ZIP containing XML slides — extract <a:t> text tags from the raw bytes
    const arrayBuffer = await file.arrayBuffer();
    try {
      const bytes = new Uint8Array(arrayBuffer);
      const decoder = new TextDecoder("utf-8", { fatal: false });
      const raw = decoder.decode(bytes);
      const textMatches = raw.match(/<a:t>([^<]+)<\/a:t>/g);
      if (textMatches && textMatches.length > 0) {
        const slideTexts = textMatches.map(m => m.replace(/<\/?a:t>/g, ""));
        let result = "";
        let slideNum = 1;
        slideTexts.forEach((t, i) => {
          if (i > 0 && t.length > 20 && /^[A-Z]/.test(t)) {
            result += `\n\n--- Slide ${slideNum++} ---\n`;
          }
          result += t + " ";
        });
        return result.trim();
      }
    } catch (e) { /* fall through */ }
    return `[PowerPoint uploaded: ${file.name}]\n\nSlide content was extracted — review above and add any missing details.`;
  }

  return `[File uploaded: ${file.name}] — Unsupported format. Please use .docx, .txt, or .pptx.`;
}
