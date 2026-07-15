// src/seed.ts
// Run once: npx ts-node src/seed.ts
// Inserts 20 sample Salesforce jobs into MongoDB

import mongoose from "mongoose";
import dotenv   from "dotenv";
import Job      from "../models/Job";

dotenv.config();

const JOBS = [
  {
    title: "Salesforce Developer",
    description: "We are looking for an experienced Salesforce Developer to join our team. You will be responsible for designing and developing Apex classes, triggers, Visualforce pages, and Lightning Web Components. You will work closely with business stakeholders to translate requirements into technical solutions.\n\nResponsibilities:\n- Develop and maintain Salesforce customizations using Apex, LWC, and SOQL\n- Integrate Salesforce with third-party systems via REST/SOAP APIs\n- Write unit tests and ensure code coverage above 85%\n- Participate in code reviews and maintain coding standards\n- Support deployment processes using CI/CD pipelines\n\nRequirements:\n- 2+ years of Salesforce development experience\n- Strong knowledge of Apex, LWC, SOQL, and SOSL\n- Salesforce Platform Developer I certification preferred\n- Experience with Git and version control",
    location: "Hyderabad, India", country: "India", workMode: "Hybrid",
    experienceLevel: "Mid", roleCategory: "Developer", skills: ["Apex", "LWC", "SOQL", "REST API"],
    salary: { min: 800000, max: 1400000, currency: "INR" }, employmentType: "Full-time",
    applyUrl: "https://careers.accenture.com", source: "Accenture",
    postedAt: new Date(Date.now() - 2 * 86400000),
    slug: "salesforce-developer-hyderabad-accenture-1",
  },
  {
    title: "Salesforce Admin",
    description: "Join our Salesforce team as an Administrator responsible for maintaining and optimising our Salesforce org. You will manage user accounts, security settings, workflows, and reports.\n\nResponsibilities:\n- Manage user accounts, profiles, roles, and permission sets\n- Create and maintain workflows, process builder flows, and approval processes\n- Build reports and dashboards for business stakeholders\n- Maintain data quality through deduplication and validation rules\n- Support end-users with training and troubleshooting\n\nRequirements:\n- Salesforce Certified Administrator certification required\n- 1-3 years of Salesforce admin experience\n- Strong understanding of Sales Cloud and Service Cloud\n- Excellent communication and problem-solving skills",
    location: "Bengaluru, India", country: "India", workMode: "Onsite",
    experienceLevel: "Associate", roleCategory: "Admin", skills: ["Flow", "Reports", "Profiles", "Validation Rules"],
    salary: { min: 500000, max: 900000, currency: "INR" }, employmentType: "Full-time",
    applyUrl: "https://careers.deloitte.com", source: "Deloitte",
    postedAt: new Date(Date.now() - 1 * 86400000),
    slug: "salesforce-admin-bengaluru-deloitte-2",
  },
  {
    title: "Salesforce Architect",
    description: "We need a senior Salesforce Solution Architect to lead our platform strategy and guide a team of developers. You will own the technical vision for our Salesforce implementation.\n\nResponsibilities:\n- Design end-to-end Salesforce solutions across Sales, Service, and Experience Cloud\n- Lead technical discovery workshops with business stakeholders\n- Define integration patterns and data architecture\n- Review and approve technical designs from development team\n- Drive Salesforce best practices and governance\n\nRequirements:\n- 6+ years of Salesforce experience\n- Salesforce Certified Application Architect or System Architect\n- Deep knowledge of governor limits, security model, and platform capabilities\n- Experience with large-scale enterprise implementations",
    location: "Remote", country: "India", workMode: "Remote",
    experienceLevel: "Senior", roleCategory: "Architect", skills: ["Solution Design", "Integration", "CPQ", "Experience Cloud"],
    salary: { min: 2000000, max: 3500000, currency: "INR" }, employmentType: "Full-time",
    applyUrl: "https://careers.capgemini.com", source: "Capgemini",
    postedAt: new Date(Date.now() - 3 * 86400000),
    slug: "salesforce-architect-remote-capgemini-3",
  },
  {
    title: "Marketing Cloud Developer",
    description: "Seeking a Marketing Cloud Developer to build and optimize customer journeys, email campaigns, and data extensions for our global marketing team.\n\nResponsibilities:\n- Build and maintain customer journeys in Journey Builder\n- Develop AMPscript and SSJS for dynamic email content\n- Manage data extensions, imports, and segmentation\n- Integrate Marketing Cloud with Sales Cloud via Marketing Cloud Connect\n- Implement tracking and reporting for campaign performance\n\nRequirements:\n- 3+ years of Salesforce Marketing Cloud experience\n- Strong AMPscript and SSJS knowledge\n- Experience with Contact Builder and Audience Builder\n- Marketing Cloud Email Specialist certification preferred",
    location: "Chennai, India", country: "India", workMode: "Hybrid",
    experienceLevel: "Mid", roleCategory: "Marketing Cloud", skills: ["AMPScript", "SSJS", "Journey Builder", "Email Studio"],
    salary: { min: 1000000, max: 1800000, currency: "INR" }, employmentType: "Full-time",
    applyUrl: "https://careers.cognizant.com", source: "Cognizant",
    postedAt: new Date(Date.now() - 0.2 * 86400000),
    slug: "marketing-cloud-developer-chennai-cognizant-4",
  },
  {
    title: "Salesforce Consultant",
    description: "We are looking for a Salesforce Functional Consultant to work with clients across banking and financial services to implement Sales Cloud and Service Cloud solutions.\n\nResponsibilities:\n- Lead requirement gathering sessions with clients\n- Configure Sales Cloud, Service Cloud, and CPQ\n- Create functional specifications and user stories\n- Conduct user acceptance testing and training\n- Manage client relationships and project delivery\n\nRequirements:\n- 2-5 years of Salesforce consulting experience\n- Salesforce Administrator and Sales Cloud Consultant certifications\n- Experience in financial services domain preferred\n- Strong presentation and stakeholder management skills",
    location: "Pune, India", country: "India", workMode: "Hybrid",
    experienceLevel: "Mid", roleCategory: "Consultant", skills: ["Sales Cloud", "Service Cloud", "CPQ", "Business Analysis"],
    salary: { min: 900000, max: 1600000, currency: "INR" }, employmentType: "Full-time",
    applyUrl: "https://careers.tcs.com", source: "TCS",
    postedAt: new Date(Date.now() - 1 * 86400000),
    slug: "salesforce-consultant-pune-tcs-5",
  },
  {
    title: "Senior Salesforce Developer",
    description: "IBM is hiring a Senior Salesforce Developer for our New York office. You will lead development of complex integrations between Salesforce and enterprise systems.\n\nResponsibilities:\n- Architect and develop Apex, LWC, and integration solutions\n- Lead a team of 3-4 junior developers\n- Design REST and SOAP API integrations\n- Conduct technical interviews and code reviews\n- Work with architects on platform design decisions\n\nRequirements:\n- 5+ years of Salesforce development\n- Experience with MuleSoft or other integration platforms\n- Salesforce Platform Developer II certification\n- Strong communication and leadership skills",
    location: "New York, USA", country: "USA", workMode: "Hybrid",
    experienceLevel: "Senior", roleCategory: "Developer", skills: ["Apex", "REST API", "MuleSoft", "LWC"],
    salary: { min: 120000, max: 160000, currency: "USD" }, employmentType: "Full-time",
    applyUrl: "https://careers.ibm.com", source: "IBM",
    postedAt: new Date(Date.now() - 4 * 86400000),
    slug: "senior-salesforce-developer-new-york-ibm-6",
  },
  {
    title: "Salesforce Business Analyst",
    description: "Looking for a Salesforce Business Analyst to bridge the gap between business needs and technical solutions within our Salesforce platform.\n\nResponsibilities:\n- Gather and document business requirements\n- Translate requirements into user stories and acceptance criteria\n- Work with developers on solution design\n- Conduct demos and UAT sessions\n- Maintain process documentation\n\nRequirements:\n- 2+ years of business analysis experience with Salesforce\n- Understanding of Sales Cloud and Service Cloud processes\n- Experience writing user stories and functional specs\n- CBAP or Salesforce Admin certification preferred",
    location: "Mumbai, India", country: "India", workMode: "Onsite",
    experienceLevel: "Associate", roleCategory: "Business Analyst", skills: ["Requirements Gathering", "User Stories", "Sales Cloud", "Process Mapping"],
    salary: { min: 700000, max: 1100000, currency: "INR" }, employmentType: "Full-time",
    applyUrl: "https://careers.infosys.com", source: "Infosys",
    postedAt: new Date(Date.now() - 5 * 86400000),
    slug: "salesforce-business-analyst-mumbai-infosys-7",
  },
  {
    title: "Salesforce CPQ Developer",
    description: "Seeking a Salesforce CPQ Developer to implement and maintain our Configure Price Quote solution for our enterprise sales team.\n\nResponsibilities:\n- Configure and develop Salesforce CPQ rules, pricing, and product bundles\n- Build custom Apex and LWC components for CPQ\n- Integrate CPQ with billing and ERP systems\n- Support sales ops team with CPQ administration\n- Create documentation and training materials\n\nRequirements:\n- 2+ years of Salesforce CPQ experience\n- Salesforce CPQ Specialist certification preferred\n- Knowledge of pricing rules, discount schedules, and product configuration\n- Experience with Apex and LWC",
    location: "London, UK", country: "UK", workMode: "Remote",
    experienceLevel: "Mid", roleCategory: "CPQ", skills: ["CPQ", "Apex", "Pricing Rules", "Product Bundles"],
    salary: { min: 65000, max: 90000, currency: "GBP" }, employmentType: "Full-time",
    applyUrl: "https://salesforce.com/careers", source: "Salesforce",
    postedAt: new Date(Date.now() - 6 * 86400000),
    slug: "salesforce-cpq-developer-london-salesforce-8",
  },
  {
    title: "Salesforce Lead Developer",
    description: "Lead our Salesforce development team at a fast-growing fintech startup. Own the technical direction of our Salesforce platform.\n\nResponsibilities:\n- Lead a team of 5 Salesforce developers\n- Design and implement complex Salesforce solutions\n- Drive CI/CD adoption using Salesforce DX and GitHub Actions\n- Define technical standards and best practices\n- Report to CTO on platform health and roadmap\n\nRequirements:\n- 7+ years of Salesforce experience\n- Previous team lead or tech lead experience\n- Deep Salesforce DX and DevOps knowledge\n- Salesforce Application Architect certification",
    location: "Bengaluru, India", country: "India", workMode: "Hybrid",
    experienceLevel: "Lead", roleCategory: "Developer", skills: ["Salesforce DX", "CI/CD", "Apex", "Team Leadership"],
    salary: { min: 2500000, max: 4000000, currency: "INR" }, employmentType: "Full-time",
    applyUrl: "https://razorpay.com/careers", source: "Razorpay",
    postedAt: new Date(Date.now() - 7 * 86400000),
    slug: "salesforce-lead-developer-bengaluru-razorpay-9",
  },
  {
    title: "Salesforce Intern",
    description: "Great opportunity for freshers to kickstart their Salesforce career! Join our team as a Salesforce Intern and learn from certified professionals.\n\nResponsibilities:\n- Learn Salesforce Admin and Developer fundamentals\n- Assist with declarative configuration (flows, reports, dashboards)\n- Shadow senior developers on Apex and LWC development\n- Work on internal tools built on Salesforce\n- Earn your Salesforce Admin certification during the internship\n\nRequirements:\n- Currently pursuing or recently completed B.E/B.Tech/MCA\n- Basic understanding of CRM concepts\n- Eager to learn and self-motivated\n- Good communication skills",
    location: "Hyderabad, India", country: "India", workMode: "Onsite",
    experienceLevel: "Intern", roleCategory: "Admin", skills: ["Salesforce Basics", "Flow Builder", "Reports"],
    salary: { min: 15000, max: 25000, currency: "INR" }, employmentType: "Internship",
    applyUrl: "https://wipro.com/careers", source: "Wipro",
    postedAt: new Date(Date.now() - 8 * 86400000),
    slug: "salesforce-intern-hyderabad-wipro-10",
  },
  {
    title: "Salesforce Service Cloud Consultant",
    description: "Implement and optimize Service Cloud for our enterprise clients across the healthcare sector.\n\nResponsibilities:\n- Configure Service Cloud including cases, knowledge, entitlements, and omni-channel\n- Implement CTI integrations and Einstein Bots\n- Design and build self-service communities\n- Train service teams on Salesforce capabilities\n- Manage post-go-live support\n\nRequirements:\n- Salesforce Service Cloud Consultant certification required\n- 3+ years of Service Cloud experience\n- Experience with CTI integration\n- Healthcare domain experience preferred",
    location: "Toronto, Canada", country: "Canada", workMode: "Remote",
    experienceLevel: "Mid", roleCategory: "Consultant", skills: ["Service Cloud", "Omni-Channel", "Einstein Bots", "Knowledge"],
    salary: { min: 90000, max: 120000, currency: "CAD" }, employmentType: "Full-time",
    applyUrl: "https://google.com/careers", source: "Google",
    postedAt: new Date(Date.now() - 9 * 86400000),
    slug: "salesforce-service-cloud-consultant-toronto-google-11",
  },
  {
    title: "Salesforce Experience Cloud Developer",
    description: "Build beautiful and performant digital experience portals on Salesforce Experience Cloud for our B2B clients.\n\nResponsibilities:\n- Design and develop Experience Cloud sites using LWC and Aura\n- Implement custom themes and Lightning App Builder pages\n- Build member portal features including self-service and knowledge base\n- Integrate Experience Cloud with external identity providers\n- Optimise portal performance\n\nRequirements:\n- 3+ years of Experience Cloud development\n- Strong LWC and JavaScript skills\n- Experience with CSS and responsive design\n- Knowledge of Salesforce security model for community users",
    location: "Sydney, Australia", country: "Australia", workMode: "Hybrid",
    experienceLevel: "Mid", roleCategory: "Developer", skills: ["Experience Cloud", "LWC", "Aura", "CSS"],
    salary: { min: 110000, max: 140000, currency: "AUD" }, employmentType: "Full-time",
    applyUrl: "https://atlassian.com/careers", source: "Atlassian",
    postedAt: new Date(Date.now() - 10 * 86400000),
    slug: "salesforce-experience-cloud-developer-sydney-atlassian-12",
  },
  {
    title: "Salesforce DevOps Engineer",
    description: "Build and maintain our Salesforce DevOps pipeline to enable fast, safe, and reliable deployments across sandbox and production environments.\n\nResponsibilities:\n- Build and maintain CI/CD pipelines for Salesforce using GitHub Actions and Salesforce DX\n- Implement automated testing frameworks (Jest, Apex tests)\n- Manage Salesforce sandboxes and environment strategy\n- Drive release management processes\n- Monitor deployment health and rollback procedures\n\nRequirements:\n- 3+ years of Salesforce DevOps experience\n- Strong Salesforce DX and CLI knowledge\n- Experience with GitHub Actions, Jenkins, or Azure DevOps\n- Salesforce DevOps certification preferred",
    location: "Berlin, Germany", country: "Germany", workMode: "Remote",
    experienceLevel: "Mid", roleCategory: "DevOps", skills: ["Salesforce DX", "GitHub Actions", "CI/CD", "Jest"],
    salary: { min: 70000, max: 95000, currency: "EUR" }, employmentType: "Full-time",
    applyUrl: "https://sap.com/careers", source: "SAP",
    postedAt: new Date(Date.now() - 11 * 86400000),
    slug: "salesforce-devops-engineer-berlin-sap-13",
  },
  {
    title: "Fresher Salesforce Developer",
    description: "Jumpstart your Salesforce career with us! We are hiring freshers with Salesforce Developer certification to join our growing practice.\n\nResponsibilities:\n- Develop Apex classes, triggers, and batch processes under senior guidance\n- Build LWC components for internal tools\n- Write unit tests and maintain code quality\n- Participate in daily standups and sprint planning\n- Learn and grow through structured mentorship\n\nRequirements:\n- Salesforce Platform Developer I certification required\n- 0-1 years of experience\n- Basic Apex and SOQL knowledge\n- Passion for learning and problem solving",
    location: "Gurugram, India", country: "India", workMode: "Onsite",
    experienceLevel: "Fresher", roleCategory: "Developer", skills: ["Apex", "SOQL", "LWC", "Triggers"],
    salary: { min: 400000, max: 700000, currency: "INR" }, employmentType: "Full-time",
    applyUrl: "https://hcltech.com/careers", source: "HCL Technologies",
    postedAt: new Date(Date.now() - 12 * 86400000),
    slug: "fresher-salesforce-developer-gurugram-hcl-14",
  },
  {
    title: "Salesforce Data Architect",
    description: "Design and own our enterprise data architecture on Salesforce, ensuring data quality, governance, and performance at scale.\n\nResponsibilities:\n- Design data models for complex Salesforce implementations\n- Define data migration strategy and ETL processes\n- Implement data governance and quality frameworks\n- Optimize SOQL queries and report performance\n- Work with data engineering team on Salesforce-to-data warehouse sync\n\nRequirements:\n- 6+ years of Salesforce experience with data architecture focus\n- Salesforce Data Architecture and Management Designer certification\n- Strong SQL and SOQL skills\n- Experience with MuleSoft, Informatica, or Talend",
    location: "San Francisco, USA", country: "USA", workMode: "Hybrid",
    experienceLevel: "Senior", roleCategory: "Architect", skills: ["Data Architecture", "SOQL", "MuleSoft", "ETL"],
    salary: { min: 150000, max: 200000, currency: "USD" }, employmentType: "Full-time",
    applyUrl: "https://salesforce.com/careers", source: "Salesforce",
    postedAt: new Date(Date.now() - 13 * 86400000),
    slug: "salesforce-data-architect-san-francisco-salesforce-15",
  },
  {
    title: "Pardot / Marketing Cloud Account Engagement Specialist",
    description: "Manage and grow our Pardot (Marketing Cloud Account Engagement) implementation to drive B2B lead generation and nurturing.\n\nResponsibilities:\n- Build and manage lead nurturing programs in Pardot\n- Set up scoring, grading, and automation rules\n- Integrate Pardot with Sales Cloud for seamless lead handoff\n- Track campaign ROI and attribution\n- Train marketing team on Pardot capabilities\n\nRequirements:\n- Salesforce Pardot Specialist certification\n- 2+ years of Pardot or MAP experience\n- Understanding of B2B marketing funnels\n- Basic HTML and CSS for email templates",
    location: "Dublin, Ireland", country: "Ireland", workMode: "Hybrid",
    experienceLevel: "Mid", roleCategory: "Marketing Cloud", skills: ["Pardot", "Lead Scoring", "Automation", "B2B Marketing"],
    salary: { min: 55000, max: 75000, currency: "EUR" }, employmentType: "Full-time",
    applyUrl: "https://hubspot.com/careers", source: "HubSpot",
    postedAt: new Date(Date.now() - 14 * 86400000),
    slug: "pardot-specialist-dublin-hubspot-16",
  },
  {
    title: "Salesforce QA Engineer",
    description: "Ensure quality of our Salesforce implementation through automated and manual testing.\n\nResponsibilities:\n- Write and maintain Apex test classes\n- Build Jest tests for LWC components\n- Perform regression testing after releases\n- Define test strategies and test plans\n- Work with developers to reproduce and fix defects\n\nRequirements:\n- 2+ years of Salesforce QA experience\n- Strong Apex unit testing knowledge\n- Experience with Jest for LWC testing\n- Understanding of CI/CD and automated testing",
    location: "Noida, India", country: "India", workMode: "Hybrid",
    experienceLevel: "Associate", roleCategory: "QA", skills: ["Apex Testing", "Jest", "LWC", "Test Automation"],
    salary: { min: 600000, max: 1000000, currency: "INR" }, employmentType: "Full-time",
    applyUrl: "https://oracle.com/careers", source: "Oracle",
    postedAt: new Date(Date.now() - 15 * 86400000),
    slug: "salesforce-qa-engineer-noida-oracle-17",
  },
  {
    title: "Salesforce Project Manager",
    description: "Lead Salesforce implementation projects from initiation to go-live for enterprise clients.\n\nResponsibilities:\n- Manage project scope, timeline, budget, and risks\n- Coordinate between business stakeholders and technical teams\n- Run agile ceremonies — sprint planning, standups, retrospectives\n- Manage client expectations and escalations\n- Create project status reports and governance documentation\n\nRequirements:\n- PMP or Prince2 certification\n- 3+ years of Salesforce project delivery experience\n- Agile/Scrum experience\n- Strong stakeholder management skills",
    location: "Amsterdam, Netherlands", country: "Netherlands", workMode: "Hybrid",
    experienceLevel: "Senior", roleCategory: "Project Manager", skills: ["Project Management", "Agile", "Risk Management", "Stakeholder Management"],
    salary: { min: 80000, max: 110000, currency: "EUR" }, employmentType: "Full-time",
    applyUrl: "https://microsoft.com/careers", source: "Microsoft",
    postedAt: new Date(Date.now() - 16 * 86400000),
    slug: "salesforce-project-manager-amsterdam-microsoft-18",
  },
  {
    title: "Salesforce Einstein Analytics Developer",
    description: "Build advanced analytics dashboards and predictive models using Salesforce Einstein Analytics (Tableau CRM).\n\nResponsibilities:\n- Design and build Tableau CRM dashboards and lenses\n- Write SAQL queries for custom analytics\n- Build Einstein Discovery predictive models\n- Connect external data sources to Tableau CRM\n- Train business users on analytics features\n\nRequirements:\n- 2+ years of Einstein Analytics / Tableau CRM experience\n- Strong SAQL and dataflow knowledge\n- Experience with Einstein Discovery\n- Salesforce Einstein Analytics and Discovery Consultant certification preferred",
    location: "Singapore", country: "Singapore", workMode: "Onsite",
    experienceLevel: "Mid", roleCategory: "Analytics", skills: ["Tableau CRM", "SAQL", "Einstein Discovery", "Analytics"],
    salary: { min: 80000, max: 110000, currency: "SGD" }, employmentType: "Full-time",
    applyUrl: "https://dbs.com/careers", source: "DBS Bank",
    postedAt: new Date(Date.now() - 17 * 86400000),
    slug: "salesforce-einstein-analytics-singapore-dbs-19",
  },
  {
    title: "Salesforce Contract Developer",
    description: "6-month contract opportunity for an experienced Salesforce Developer to join an ongoing transformation project.\n\nResponsibilities:\n- Deliver Apex and LWC development tasks from the backlog\n- Work within an established team and follow existing coding standards\n- Participate in daily standups and sprint ceremonies\n- Ensure code coverage and documentation standards are met\n\nRequirements:\n- 3+ years of Salesforce development\n- Available to start within 2 weeks\n- Strong Apex and LWC skills\n- Previous contract experience preferred",
    location: "Remote", country: "India", workMode: "Remote",
    experienceLevel: "Mid", roleCategory: "Developer", skills: ["Apex", "LWC", "SOQL", "Git"],
    salary: { min: 80000, max: 120000, currency: "INR" }, employmentType: "Contract",
    applyUrl: "https://upwork.com", source: "Upwork",
    postedAt: new Date(Date.now() - 18 * 86400000),
    slug: "salesforce-contract-developer-remote-upwork-20",
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("✅ Connected to MongoDB");

    await Job.deleteMany({});
    console.log("🗑️  Cleared existing jobs");

    await Job.insertMany(JOBS);
    console.log(`✅ Inserted ${JOBS.length} sample jobs`);

    await mongoose.disconnect();
    console.log("✅ Done. Run npm run dev to start the server.");
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
}

seed();