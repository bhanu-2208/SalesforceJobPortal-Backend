/*
|--------------------------------------------------------------------------
| Hard Reject Title Terms
|--------------------------------------------------------------------------
|
| If ANY of these appear in the job title,
| the job is immediately rejected.
|
*/

export const REJECT_TITLE_TERMS = [

    // ---------------------------------------------------------------------
    // Sales
    // ---------------------------------------------------------------------

    "Sales",
    "Sales Representative",
    "Sales Rep",
    "Sales Associate",
    "Sales Executive",
    "Sales Consultant",
    "Sales Specialist",
    "Sales Manager",
    "Sales Director",
    "Regional Sales Manager",
    "Area Sales Manager",
    "Territory Manager",
    "Territory Sales",
    "Account Executive",
    "Enterprise Account Executive",
    "Inside Sales",
    "Outside Sales",
    "Sales Operations",
    "Sales Enablement",
    "Sales Trainer",
    "Sales Coordinator",

    // ---------------------------------------------------------------------
    // Business Development
    // ---------------------------------------------------------------------

    "Business Development",
    "Business Development Representative",
    "BDR",
    "SDR",
    "Lead Generation",
    "Prospecting",

    // ---------------------------------------------------------------------
    // Recruiting
    // ---------------------------------------------------------------------

    "Recruiter",
    "Technical Recruiter",
    "Senior Recruiter",
    "Campus Recruiter",
    "Talent Acquisition",
    "Talent Partner",
    "Talent Specialist",
    "Staffing",

    // ---------------------------------------------------------------------
    // HR
    // ---------------------------------------------------------------------

    "Human Resources",
    "HR",
    "HRBP",
    "People Operations",
    "People Partner",
    "HR Manager",
    "HR Generalist",

    // ---------------------------------------------------------------------
    // Marketing
    // ---------------------------------------------------------------------

    "Marketing",
    "Marketing Manager",
    "Marketing Specialist",
    "Content Marketing",
    "Content Writer",
    "Content Strategist",
    "SEO",
    "SEM",
    "Copywriter",
    "Brand Manager",
    "Digital Marketing",
    "Social Media",

    // ---------------------------------------------------------------------
    // Finance
    // ---------------------------------------------------------------------

    "Finance",
    "Finance Manager",
    "Finance Director",
    "Financial Analyst",
    "Controller",
    "Accounting",
    "Accountant",
    "Payroll",
    "Treasury",
    "Audit",
    "Auditor",

    // ---------------------------------------------------------------------
    // Legal
    // ---------------------------------------------------------------------

    "Legal",
    "Attorney",
    "Lawyer",
    "Paralegal",
    "Counsel",
    "Compliance Officer",

    // ---------------------------------------------------------------------
    // Product
    // ---------------------------------------------------------------------

    "Product Manager",
    "Senior Product Manager",
    "Associate Product Manager",
    "Product Owner",
    "Product Designer",

    // ---------------------------------------------------------------------
    // Design
    // ---------------------------------------------------------------------

    "Designer",
    "UX",
    "UX Designer",
    "UI",
    "UI Designer",
    "Graphic Designer",
    "Visual Designer",
    "Interaction Designer",
    "Product Design",

    // ---------------------------------------------------------------------
    // Customer Support
    // ---------------------------------------------------------------------

    "Customer Success",
    "Customer Support",
    "Customer Service",
    "Support Specialist",
    "Support Engineer",
    "Technical Support",

    // ---------------------------------------------------------------------
    // Office
    // ---------------------------------------------------------------------

    "Executive Assistant",
    "Office Assistant",
    "Office Manager",
    "Receptionist",
    "Administrative Assistant",

    // ---------------------------------------------------------------------
    // Data
    // ---------------------------------------------------------------------

    "Data Engineer",
    "Senior Data Engineer",
    "Principal Data Engineer",
    "Staff Data Engineer",
    "Data Scientist",
    "Analytics Engineer",
    "BI Engineer",
    "Business Intelligence",
    "Data Analyst",

    // ---------------------------------------------------------------------
    // AI
    // ---------------------------------------------------------------------

    "Machine Learning",
    "Machine Learning Engineer",
    "ML Engineer",
    "AI Engineer",
    "Artificial Intelligence",
    "LLM",
    "Generative AI",
    "Prompt Engineer",
    "Research Engineer",
    "Research Scientist",
    "Computer Vision",
    "NLP Engineer",

    // ---------------------------------------------------------------------
    // DevOps
    // ---------------------------------------------------------------------

    "DevOps",
    "Site Reliability",
    "SRE",
    "Infrastructure Engineer",
    "Cloud Engineer",
    "Network Engineer",
    "Security Engineer",

    // ---------------------------------------------------------------------
    // Software
    // ---------------------------------------------------------------------

    "Backend Engineer",
    "Backend Developer",
    "Frontend Engineer",
    "Frontend Developer",
    "Full Stack Engineer",
    "Full-Stack Engineer",
    "Staff Software Engineer",
    "Principal Software Engineer",
    "Mobile Engineer",
    "Android Engineer",
    "iOS Engineer",

    // ---------------------------------------------------------------------
    // QA
    // ---------------------------------------------------------------------

    "QA Engineer",
    "QA Analyst",
    "Test Engineer",
    "Automation Engineer",
    "Quality Assurance",

    // ---------------------------------------------------------------------
    // Misc
    // ---------------------------------------------------------------------

    "Program Manager",
    "Project Coordinator",
    "Operations Manager",
    "Operations Analyst",
    "Supply Chain",
    "Procurement",
    "Buyer",
    "Manufacturing",
    "Warehouse",
    "Driver",
    "Nurse",
    "Doctor",
    "Pharmacist",
    "Teacher"

] as const;

/*
|--------------------------------------------------------------------------
| Sales Vocabulary
|--------------------------------------------------------------------------
|
| These words indicate SALES jobs,
| not Salesforce platform jobs.
|
*/

export const SALES_WORDS = [

    "quota",
    "commission",
    "cold calling",
    "cold-call",
    "prospecting",
    "pipeline generation",
    "lead generation",
    "closing deals",
    "sales target",
    "territory",
    "upselling",
    "cross selling",
    "hunter",
    "new business",
    "revenue target",
    "monthly target",
    "sales incentive"

] as const;

/*
|--------------------------------------------------------------------------
| Departments
|--------------------------------------------------------------------------
|
| Used for department detection.
|
*/

export const NON_SF_DEPARTMENTS = [

    "marketing",
    "finance",
    "legal",
    "design",
    "hr",
    "human resources",
    "sales",
    "operations",
    "product",
    "security",
    "network",
    "it support",
    "customer success",
    "customer support",
    "talent acquisition",
    "machine learning",
    "artificial intelligence",
    "data science"

] as const;