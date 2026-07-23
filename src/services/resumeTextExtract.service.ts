import path from "path";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

// Was extractResumeText(filePath: string) reading off local disk.
// Now fetches the file bytes over HTTP from Cloudinary's URL instead
// — same output (raw text), different input. Every caller of this
// function just needs to pass profile.resume.url (now a full
// https://res.cloudinary.com/... URL) instead of a local path.
//
// Requires Node 18+ for the global `fetch` — already the case for any
// current Next.js/Express setup; if you're on an older Node runtime,
// swap this for `node-fetch` instead.
export async function extractResumeTextFromUrl(fileUrl: string): Promise<string> {
  const ext = path.extname(new URL(fileUrl).pathname).toLowerCase();

  const res = await fetch(fileUrl);

  console.log("Status:", res.status);
  console.log("Status Text:", res.statusText);
  console.log("URL:", fileUrl);

  if (!res.ok) {
      const body = await res.text();
      console.log(body);

      throw new Error(
          `Download failed: ${res.status} ${res.statusText}`
      );
  }
  const buffer = Buffer.from(await res.arrayBuffer());

  if (ext === ".pdf") {
    const result = await pdfParse(buffer);
    return result.text;
  }

  if (ext === ".docx") {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (ext === ".doc") {
    throw new Error("Old .doc format isn't supported for AI parsing — please upload a PDF or .docx file instead.");
  }

  throw new Error("Unsupported resume format for AI parsing.");
}