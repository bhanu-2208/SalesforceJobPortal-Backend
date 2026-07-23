export type SalesforceCategory =
    | "Developer"
    | "Administrator"
    | "Architect"
    | "Consultant"
    | "Business Analyst"
    | "QA"
    | "Platform Engineer"
    | "CPQ"
    | "Marketing Cloud"
    | "Service Cloud"
    | "Sales Cloud"
    | "Data Cloud"
    | "Agentforce"
    | "OmniStudio"
    | "MuleSoft"
    | "Technical Lead"
    | "Unknown";

interface CategoryResult {
    category: SalesforceCategory;
    confidence: number;
}

export function detectCategory(
    title: string,
    description: string
): CategoryResult {

    const text = `${title} ${description}`.toLowerCase();

    // -------------------------------------------------
    // Developer
    // -------------------------------------------------

    if (
        text.includes("developer") ||
        text.includes("apex") ||
        text.includes("lwc") ||
        text.includes("lightning web component") ||
        text.includes("visualforce")
    ) {
        return {
            category: "Developer",
            confidence: 100
        };
    }

    // -------------------------------------------------
    // Administrator
    // -------------------------------------------------

    if (
        text.includes("administrator") ||
        text.includes("admin") ||
        text.includes("flow builder") ||
        text.includes("permission sets") ||
        text.includes("profiles")
    ) {
        return {
            category: "Administrator",
            confidence: 98
        };
    }

    // -------------------------------------------------
    // Architect
    // -------------------------------------------------

    if (
        text.includes("architect") ||
        text.includes("technical architect") ||
        text.includes("solution architect")
    ) {
        return {
            category: "Architect",
            confidence: 100
        };
    }

    // -------------------------------------------------
    // Consultant
    // -------------------------------------------------

    if (
        text.includes("consultant") ||
        text.includes("functional consultant") ||
        text.includes("technical consultant")
    ) {
        return {
            category: "Consultant",
            confidence: 95
        };
    }

    // -------------------------------------------------
    // Business Analyst
    // -------------------------------------------------

    if (
        text.includes("business analyst") ||
        text.includes("business systems analyst")
    ) {
        return {
            category: "Business Analyst",
            confidence: 90
        };
    }

    // -------------------------------------------------
    // QA
    // -------------------------------------------------

    if (
        text.includes("qa") ||
        text.includes("tester") ||
        text.includes("quality assurance") ||
        text.includes("test automation")
    ) {
        return {
            category: "QA",
            confidence: 90
        };
    }

    // -------------------------------------------------
    // Platform Engineer
    // -------------------------------------------------

    if (
        text.includes("platform engineer")
    ) {
        return {
            category: "Platform Engineer",
            confidence: 95
        };
    }

    // -------------------------------------------------
    // CPQ
    // -------------------------------------------------

    if (
        text.includes("cpq") ||
        text.includes("revenue cloud")
    ) {
        return {
            category: "CPQ",
            confidence: 95
        };
    }

    // -------------------------------------------------
    // Marketing Cloud
    // -------------------------------------------------

    if (
        text.includes("marketing cloud") ||
        text.includes("pardot") ||
        text.includes("account engagement")
    ) {
        return {
            category: "Marketing Cloud",
            confidence: 95
        };
    }

    // -------------------------------------------------
    // Service Cloud
    // -------------------------------------------------

    if (
        text.includes("service cloud")
    ) {
        return {
            category: "Service Cloud",
            confidence: 95
        };
    }

    // -------------------------------------------------
    // Sales Cloud
    // -------------------------------------------------

    if (
        text.includes("sales cloud")
    ) {
        return {
            category: "Sales Cloud",
            confidence: 95
        };
    }

    // -------------------------------------------------
    // Data Cloud
    // -------------------------------------------------

    if (
        text.includes("data cloud")
    ) {
        return {
            category: "Data Cloud",
            confidence: 95
        };
    }

    // -------------------------------------------------
    // Agentforce / Einstein
    // -------------------------------------------------

    if (
        text.includes("agentforce") ||
        text.includes("einstein")
    ) {
        return {
            category: "Agentforce",
            confidence: 95
        };
    }

    // -------------------------------------------------
    // OmniStudio
    // -------------------------------------------------

    if (
        text.includes("omnistudio") ||
        text.includes("omniscript") ||
        text.includes("dataraptor") ||
        text.includes("flexcards")
    ) {
        return {
            category: "OmniStudio",
            confidence: 95
        };
    }

    // -------------------------------------------------
    // MuleSoft
    // -------------------------------------------------

    if (
        text.includes("mulesoft") ||
        text.includes("dataweave") ||
        text.includes("anypoint")
    ) {
        return {
            category: "MuleSoft",
            confidence: 95
        };
    }

    // -------------------------------------------------
    // Technical Lead
    // -------------------------------------------------

    if (
        text.includes("technical lead") ||
        text.includes("salesforce lead") ||
        text.includes("lead developer")
    ) {
        return {
            category: "Technical Lead",
            confidence: 90
        };
    }

    return {
        category: "Unknown",
        confidence: 0
    };
}