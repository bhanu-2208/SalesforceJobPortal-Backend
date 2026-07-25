import ATSCompany from "../models/ATSCompany";
import { RawExternalJob } from "./types";
import { fetchFromAshby } from "./ashby.importer";
import { fetchFromGreenhouse } from "./greenhouse.importer";
import { fetchFromSmartRecruiters } from "./smartrecruiters.importer";
import { fetchFromTeamtailor } from "./teamtailor.importer";

export async function fetchAllExternalJobs(): Promise<RawExternalJob[]> {
  const companies = await ATSCompany.find({ active: true });

  const jobs: RawExternalJob[] = [];

  for (const company of companies) {
    try {
      switch (company.ats) {
        case "ashby":
          jobs.push(
            ...(await fetchFromAshby(company.token, company.name))
          );
          break;

        case "greenhouse":
          jobs.push(
            ...(await fetchFromGreenhouse(company.token, company.name))
          );
          break;

        case "smartrecruiters":
          jobs.push(
            ...(await fetchFromSmartRecruiters(company.token, company.name))
          );
          break;

        case "teamtailor":
          jobs.push(
            ...(await fetchFromTeamtailor(company.token, company.name))
          );
          break;
      }
    } catch (err) {
      // console.error(`Failed for ${company.name}:`, err);
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