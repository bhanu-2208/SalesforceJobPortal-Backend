import { RawExternalJob } from "./types";
import { fetchFromAshby } from "./ashby.importer";
import { fetchFromGreenhouse } from "./greenhouse.importer";
import { fetchFromSmartRecruiters } from "./smartrecruiters.importer";
import { fetchFromTeamtailor } from "./teamtailor.importer";

export async function fetchAllExternalJobs(): Promise<RawExternalJob[]> {
  // Run all four sources in parallel — one source being slow (or fully
  // down) shouldn't hold up the others.
  const results = await Promise.allSettled([
    fetchFromAshby(),
    fetchFromGreenhouse(),
    fetchFromSmartRecruiters(),
    fetchFromTeamtailor(),
  ]);

  const jobs: RawExternalJob[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      jobs.push(...result.value);
    } else {
      console.error("A job source failed entirely:", result.reason);
    }
  }

  return jobs;
}

export {
  fetchFromAshby,
  fetchFromGreenhouse,
  fetchFromSmartRecruiters,
  fetchFromTeamtailor,
};