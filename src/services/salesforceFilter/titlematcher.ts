import {
    SALESFORCE_TITLES,
    SALESFORCE_TECHNOLOGIES
} from "./keywords";

import { REJECT_TITLE_TERMS  } from "./rejectKeywords";

export interface TitleMatchResult {
    accepted: boolean;
    confidence: number;
    reason: string;
    matchedTitle?: string;
    matchedTechnology?: string;
}

/**
 * Checks only the JOB TITLE.
 * Does not inspect description.
 */
export function matchTitle(title: string): TitleMatchResult {

    const normalized = title
        .toLowerCase()
        .replace(/[()_,\-\/]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    // -------------------------------------------------------
    // HARD REJECTS
    // -------------------------------------------------------

    for (const reject of REJECT_TITLE_TERMS) {

        const regex = new RegExp(`\\b${reject.toLowerCase()}\\b`, "i");

        if (regex.test(normalized)) {

            return {
                accepted: false,
                confidence: 0,
                reason: `Rejected because title contains "${reject}".`
            };
        }
    }

    // -------------------------------------------------------
    // EXACT SALESFORCE TITLES
    // -------------------------------------------------------

    for (const keyword of SALESFORCE_TITLES) {

        if (normalized.includes(keyword.toLowerCase())) {

            return {
                accepted: true,
                confidence: 100,
                reason: "Matched Salesforce title.",
                matchedTitle: keyword
            };
        }
    }

    // -------------------------------------------------------
    // TECHNOLOGY WORDS
    // -------------------------------------------------------

    for (const tech of SALESFORCE_TECHNOLOGIES) {

        if (normalized.includes(tech.toLowerCase())) {

            return {
                accepted: true,
                confidence: 70,
                reason: "Salesforce technology mentioned in title.",
                matchedTechnology: tech
            };
        }
    }

    // -------------------------------------------------------
    // Generic CRM titles
    // -------------------------------------------------------

    if (
        normalized.includes("crm") &&
        (
            normalized.includes("developer") ||
            normalized.includes("engineer") ||
            normalized.includes("consultant") ||
            normalized.includes("architect") ||
            normalized.includes("administrator")
        )
    ) {

        return {
            accepted: true,
            confidence: 60,
            reason: "Generic CRM title."
        };
    }

    // -------------------------------------------------------
    // Business Systems
    // -------------------------------------------------------

    if (
        normalized.includes("business systems") ||
        normalized.includes("business applications")
    ) {

        return {
            accepted: true,
            confidence: 45,
            reason: "Business Systems title. Needs description verification."
        };
    }

    // -------------------------------------------------------
    // Unknown
    // -------------------------------------------------------

    return {
        accepted: false,
        confidence: 0,
        reason: "Title is not Salesforce related."
    };
}