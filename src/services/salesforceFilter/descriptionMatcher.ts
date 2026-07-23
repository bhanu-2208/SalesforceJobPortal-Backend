import { SALESFORCE_TECHNOLOGIES } from "./keywords";

import {
    SALES_WORDS,
    NON_SF_DEPARTMENTS
} from "./rejectKeywords";


export interface DescriptionResult {

    technologyMatches: string[];

    salesWords: string[];

    departmentMatches: string[];

    technologyScore: number;

    confidence: number;

    accepted: boolean;
}


// Salesforce terms that should NOT be treated as sales jobs
const SALESFORCE_CONTEXT_WORDS = [
    "salesforce",
    "sales cloud",
    "service cloud",
    "marketing cloud",
    "commerce cloud",
    "experience cloud",
    "cpq"
];


// Escape regex special characters
function escapeRegex(value: string): string {

    return value.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );
}


// Word matching helper
function containsWord(
    text: string,
    word: string
): boolean {

    const escaped = escapeRegex(
        word.toLowerCase()
    );

    return new RegExp(
        `\\b${escaped}\\b`,
        "i"
    ).test(text);
}



export function matchDescription(
    description: string
): DescriptionResult {


    const text = description.toLowerCase();


    const technologyMatches: string[] = [];

    const salesMatches: string[] = [];

    const departmentMatches: string[] = [];



    // ---------------------------------------------
    // Salesforce Technology Detection
    // ---------------------------------------------

    for (const tech of SALESFORCE_TECHNOLOGIES) {

        if (containsWord(text, tech)) {

            technologyMatches.push(tech);

        }
    }



    // ---------------------------------------------
    // Sales Vocabulary Detection
    // ---------------------------------------------

    for (const word of SALES_WORDS) {


        // Ignore Salesforce product names
        const isSalesforceContext =
            SALESFORCE_CONTEXT_WORDS.some(
                item =>
                    text.includes(item)
            );


        if (isSalesforceContext) {

            continue;

        }



        if (containsWord(text, word)) {

            salesMatches.push(word);

        }

    }



    // ---------------------------------------------
    // Non Salesforce Department Detection
    // ---------------------------------------------

    for (const department of NON_SF_DEPARTMENTS) {


        if (
            containsWord(
                text,
                department
            )
        ) {

            departmentMatches.push(department);

        }

    }



    // ---------------------------------------------
    // Confidence Calculation
    // ---------------------------------------------


    const technologyScore =
        technologyMatches.length * 10;



    let confidence = technologyScore;



    // Sales penalty
    // Reduced because Salesforce jobs naturally mention sales concepts

    confidence -= salesMatches.length * 3;



    // Department penalty

    confidence -= departmentMatches.length * 4;



    confidence = Math.max(
        0,
        Math.min(
            confidence,
            100
        )
    );



    const accepted =
        technologyMatches.length >= 1 ||
        technologyScore >= 10;



    return {

        technologyMatches,

        salesWords: salesMatches,

        departmentMatches,

        technologyScore,

        confidence,

        accepted

    };

}