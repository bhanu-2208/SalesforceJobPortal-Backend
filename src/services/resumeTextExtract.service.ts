import fs from "fs/promises";
import path from "path";

// pdf-parse and mammoth are both free, MIT-licensed npm packages —
// no paid OCR/parsing service involved. Install with:
//   npm install pdf-parse mammoth
//   npm install -D @types/pdf-parse
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

export async function extractResumeText(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();
  const buffer = await fs.readFile(filePath);

  if (ext === ".pdf") {
    const result = await pdfParse(buffer);
    return result.text;
  }

  if (ext === ".docx") {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (ext === ".doc") {
    // Legacy binary .doc isn't reliably parseable by either library.
    // Ask the user to re-upload as PDF/DOCX rather than silently
    // returning garbage text to the AI.
    throw new Error("Old .doc format isn't supported for AI parsing — please upload a PDF or .docx file instead.");
  }

  throw new Error("Unsupported resume format for AI parsing.");
}