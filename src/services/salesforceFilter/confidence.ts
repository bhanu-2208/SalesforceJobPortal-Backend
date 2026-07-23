import { TitleMatchResult } from "./titlematcher";
import { DescriptionResult } from "./descriptionMatcher";

export interface ConfidenceResult {
    score: number;
    accepted: boolean;
    reason: string;
}

const PASS_SCORE = 60;

export function calculateConfidence(
    title: TitleMatchResult,
    description: DescriptionResult
): ConfidenceResult {

    let score = 0;

    // ---------------------------------------------------
    // TITLE
    // ---------------------------------------------------

    score += title.confidence * 0.75;
    score += description.confidence * 0.25;

    // ---------------------------------------------------
    // DESCRIPTION
    // ---------------------------------------------------


    // ---------------------------------------------------
    // Strong technology bonus
    // ---------------------------------------------------

    if (description.technologyMatches.length >= 5) {
        score += 15;
    }

    if (description.technologyMatches.length >= 10) {
        score += 10;
    }

    // ---------------------------------------------------
    // Sales penalty
    // ---------------------------------------------------

    if(description.salesWords.length > 5){
        score -= (description.salesWords.length - 5) * 3;
    }

    // ---------------------------------------------------
    // Department penalty
    // ---------------------------------------------------

    score -= description.departmentMatches.length * 5;

    // ---------------------------------------------------
    // Clamp
    // ---------------------------------------------------

    score = Math.max(0, Math.min(100, Math.round(score)));

    const accepted = score >= PASS_SCORE;

    let reason = "";

    if (accepted) {

        reason = `Accepted (${score}/100 confidence)`;

    } else {

        reason = `Rejected (${score}/100 confidence)`;
    }

    return {
        score,
        accepted,
        reason
    };
}