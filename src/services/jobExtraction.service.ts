import { cleanHTML } from "../utils/htmlcleaner";

interface RawExternalJob {
  description: string;
}

export async function getFullDescription(
  raw: RawExternalJob
): Promise<string> {
  return cleanHTML(raw.description);
}