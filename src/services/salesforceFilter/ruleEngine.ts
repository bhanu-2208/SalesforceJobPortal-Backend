import { matchTitle } from "./titlematcher";
import { matchDescription } from "./descriptionMatcher";
import { detectCategory } from "./categoryDetector";
import { calculateConfidence } from "./confidence";

export interface RuleResult {
    accepted: boolean;

    score: number;

    confidence: number;

    reason: string;

    category: string;

    matchedTitle?: string;

    matchedTechnology?: string;

    matchedTechnologies: string[];

    salesWords: string[];

    departments: string[];
}

interface JobInput {
    title: string;
    description: string;
}

export function evaluateSalesforceJob(
    job: JobInput
): RuleResult {

    // ----------------------------------------------------
    // Step 1 : Title Analysis
    // ----------------------------------------------------

    const titleResult = matchTitle(job.title);

    // Hard reject immediately
    if (!titleResult.accepted && titleResult.confidence === 0) {

        return {

            accepted: titleResult.accepted,
            score: 0,

            confidence: titleResult.confidence,

            reason: titleResult.reason,

            matchedTitle: titleResult.matchedTitle,

            matchedTechnology: titleResult.matchedTechnology,

            category: "Unknown",

            matchedTechnologies: [],

            salesWords: [],

            departments: []
        };
    }

    // ----------------------------------------------------
    // Step 2 : Description Analysis
    // ----------------------------------------------------

    const descriptionResult =
        matchDescription(job.description);

    // ----------------------------------------------------
    // Step 3 : Category Detection
    // ----------------------------------------------------

    const category =
        detectCategory(
            job.title,
            job.description
        );

    // ----------------------------------------------------
    // Step 4 : Final Confidence
    // ----------------------------------------------------

    const confidence =
        calculateConfidence(
            titleResult,
            descriptionResult
        );

    // ----------------------------------------------------
    // Final Result
    // ----------------------------------------------------

    return {

        accepted: confidence.accepted,

        score: confidence.score,

        confidence: confidence.score,

        reason: confidence.reason,

        category: category.category,

        matchedTitle:
            titleResult.matchedTitle,

        matchedTechnology:
            titleResult.matchedTechnology,

        matchedTechnologies:
            descriptionResult.technologyMatches,

        salesWords:
            descriptionResult.salesWords,

        departments:
            descriptionResult.departmentMatches
    };
}