import Job from "../models/Job";
import Company from "../models/Company";

function slugify(text: string): string {
  return text.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export interface JobFilters {
  q?:               string;
  country?:         string;
  role?:            string;
  experienceLevel?: string;
  workMode?:        string;
  employmentType?:  string;
  page?:            number;
  limit?:           number;
}

export async function getAllJobs(filters: JobFilters) {
  const page  = Math.max(1, filters.page  ?? 1);
  const limit = Math.min(50, filters.limit ?? 20);
  const skip  = (page - 1) * limit;
  const query: Record<string, any> = {};

  // ── Keyword search across every visible field ──────────────────────
  if (filters.q) {
    const regex = new RegExp(filters.q, "i");

    // Find companies whose name matches the keyword, so we can also
    // match jobs by company name (company is a separate collection).
    const matchingCompanies = await Company.find({ name: regex }).select("_id").lean();
    const matchingCompanyIds = matchingCompanies.map((c: any) => c._id);

    query.$or = [
      { title:           regex },
      { description:     regex },
      { roleCategory:    regex },
      { location:        regex },
      { country:         regex },
      { workMode:        regex },
      { experienceLevel: regex },
      { employmentType:  regex },
      { skills:          { $in: [regex] } },
      ...(matchingCompanyIds.length > 0 ? [{ company: { $in: matchingCompanyIds } }] : []),
    ];
  }

  // ── Explicit filters (sidebar) ──────────────────────────────────────
  if (filters.country)         query.country         = { $regex: filters.country, $options: "i" };
  if (filters.role) {
    const cleanRole = filters.role.trim().replace(/\s+/g, " ");
    const coreWord = cleanRole.replace(/^Salesforce\s+/i, "").trim();
    // Match against title OR roleCategory — catches jobs where only the title has the role
    query.$and = query.$and || [];
    query.$and.push({
      $or: [
        { title:        { $regex: cleanRole, $options: "i" } },
        { title:        { $regex: coreWord,  $options: "i" } },
        { roleCategory: { $regex: coreWord,  $options: "i" } },
      ],
    });
  }
  if (filters.experienceLevel) query.experienceLevel = filters.experienceLevel;
  if (filters.workMode)        query.workMode        = filters.workMode;
  if (filters.employmentType)  query.employmentType  = filters.employmentType;

  const [total, data] = await Promise.all([
    Job.countDocuments(query),
    Job.find(query)
      .populate("company", "name logoUrl website")
      .sort({ postedAt: -1, createdAt: -1 })
      .skip(skip).limit(limit).lean(),
  ]);

  return { data, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getJobBySlug(slug: string) {
  return Job.findOne({ slug }).populate("company", "name logo website").lean();
}

export async function createJob(input: any, postedBy?: string) {
  if (input.companyName) {
    const Company = (await import("../models/Company")).default;
    let company = await Company.findOne({
      name: { $regex: `^${input.companyName.trim()}$`, $options: "i" },
    });
    if (!company) {
      company = await Company.create({ name: input.companyName.trim(), logoUrl: input.companyLogo || undefined, jobCount: 1 });
    } else {
      await Company.findByIdAndUpdate(company._id, { $inc: { jobCount: 1 } });
      if (input.companyLogo && !company.logoUrl) { company.logoUrl = input.companyLogo; await company.save(); }
    }
    input.company = company._id;
    delete input.companyName;
    delete input.companyLogo;
  }
 
  if (postedBy) input.postedBy = postedBy;   // ← NEW LINE
 
  for (const key of Object.keys(input)) { if (input[key] === "") delete input[key]; }
  if (!input.slug) input.slug = slugify(`${input.title}-${input.location ?? ""}-${Date.now()}`);
  if (!input.postedAt) input.postedAt = new Date();
  input.overview ??= "";
  input.responsibilities ??= [];
  input.requirements ??= [];
  input.preferredQualifications ??= [];
  input.benefits ??= [];
  input.skills ??= [];
  input.salesforceProducts ??= [];
  input.certifications ??= [];
  return new Job(input).save();
}
 

export async function updateJob(id: string, input: any) {
  return Job.findByIdAndUpdate(id, input, { new: true }).lean();
}

export async function deleteJob(id: string, requesterId: string, requesterRole: string) {
  const job = await Job.findById(id).select("company postedBy").lean();
  if (!job) return null;
 
  // Ownership check — admin can delete any job; recruiter only their own
  if (requesterRole !== "admin") {
    if (!job.postedBy || job.postedBy.toString() !== requesterId) {
      throw Object.assign(new Error("You can only delete jobs you posted."), { status: 403 });
    }
  }
 
  const SavedJob = (await import("../models/SavedJob")).default;
  await SavedJob.deleteMany({ job: id });
 
  const deleted = await Job.findByIdAndDelete(id);
 
  if (job.company) {
    const Company = (await import("../models/Company")).default;
    const updated = await Company.findOneAndUpdate(
      { _id: job.company, jobCount: { $gt: 0 } },
      { $inc: { jobCount: -1 } },
      { returnDocument: "after" }
    );
    if (updated && updated.jobCount === 0) await Company.findByIdAndDelete(job.company);
  }
  return deleted;
}
 
export async function seedJobs() {
  const count = await Job.countDocuments();
  if (count > 0) return { message: "Jobs already seeded.", count };

  const dummy = [
    { title:"Salesforce Developer", location:"Hyderabad, India", country:"India", workMode:"Hybrid", experienceLevel:"Mid", roleCategory:"Developer", skills:["Apex","LWC","SOQL","REST API"], salary:{min:800000,max:1400000,currency:"INR"}, employmentType:"Full-time", applyUrl:"https://careers.accenture.com", postedAt:new Date(Date.now()-2*86400000), description:`We are looking for an experienced Salesforce Developer to join our dynamic team.\n\nResponsibilities:\n• Design, develop, and deploy Salesforce solutions using Apex and LWC\n• Integrate Salesforce with external systems via REST APIs\n• Write clean, testable code and participate in code reviews\n• Collaborate with business analysts to translate requirements\n\nRequirements:\n• 2-4 years of Salesforce development experience\n• Strong knowledge of Apex, LWC, SOQL\n• Salesforce Platform Developer I certification preferred` },
    { title:"Salesforce Administrator", location:"Bengaluru, India", country:"India", workMode:"Onsite", experienceLevel:"Associate", roleCategory:"Admin", skills:["Flow","Reports","Profiles","Data Loader"], salary:{min:600000,max:1000000,currency:"INR"}, employmentType:"Full-time", applyUrl:"https://careers.deloitte.com", postedAt:new Date(Date.now()-1*86400000), description:`Deloitte is hiring a Salesforce Administrator to manage and optimise our org.\n\nResponsibilities:\n• Manage user accounts, profiles, roles, and permissions\n• Build automation using Flow and Process Builder\n• Create and maintain reports and dashboards\n• Troubleshoot user issues and provide training\n\nRequirements:\n• 1-3 years Salesforce Administration experience\n• ADM201 certification required\n• Strong knowledge of Sales Cloud and Service Cloud` },
    { title:"Salesforce Architect", location:"Remote", country:"India", workMode:"Remote", experienceLevel:"Senior", roleCategory:"Architect", skills:["Solution Design","Integration","CPQ","Platform Events"], salary:{min:2000000,max:3500000,currency:"INR"}, employmentType:"Full-time", applyUrl:"https://careers.capgemini.com", postedAt:new Date(Date.now()-3*86400000), description:`Capgemini seeks a Solution Architect to lead enterprise Salesforce implementations.\n\nResponsibilities:\n• Design end-to-end Salesforce architecture for enterprise clients\n• Lead technical discovery workshops\n• Define integration patterns, data models, and security architecture\n• Mentor developers and ensure best practices\n\nRequirements:\n• 6+ years Salesforce experience, 2+ as Architect\n• Application Architect or System Architect certification preferred\n• Deep expertise in integration patterns` },
    { title:"Marketing Cloud Developer", location:"Chennai, India", country:"India", workMode:"Hybrid", experienceLevel:"Mid", roleCategory:"Marketing Cloud", skills:["AMPScript","SSJS","Journey Builder","SQL"], salary:{min:1000000,max:1800000,currency:"INR"}, employmentType:"Full-time", applyUrl:"https://careers.cognizant.com", postedAt:new Date(Date.now()-5*3600000), description:`Cognizant is looking for a Marketing Cloud Developer to build personalised customer journeys.\n\nResponsibilities:\n• Build and manage email campaigns and automation\n• Develop AMPScript and SSJS for personalisation\n• Implement Journey Builder flows\n• Monitor deliverability and campaign performance\n\nRequirements:\n• 3-5 years Marketing Cloud experience\n• Proficiency in AMPScript, SSJS, SQL\n• Marketing Cloud Email Specialist certification preferred` },
    { title:"Salesforce Consultant", location:"Pune, India", country:"India", workMode:"Onsite", experienceLevel:"Mid", roleCategory:"Consultant", skills:["Sales Cloud","Service Cloud","CPQ","Agile"], salary:{min:800000,max:1500000,currency:"INR"}, employmentType:"Full-time", applyUrl:"https://careers.tcs.com", postedAt:new Date(Date.now()-1*86400000), description:`TCS is hiring a Salesforce Functional Consultant to drive CRM transformation.\n\nResponsibilities:\n• Gather and document business requirements\n• Configure Sales Cloud and Service Cloud\n• Run UAT and end-user training\n• Manage project deliverables and timelines\n\nRequirements:\n• 2-5 years Salesforce consulting experience\n• Salesforce Administrator or App Builder certification\n• Excellent client-facing skills` },
    { title:"Senior Salesforce Developer", location:"New York, USA", country:"USA", workMode:"Remote", experienceLevel:"Senior", roleCategory:"Developer", skills:["Apex","REST API","LWC","CI/CD"], salary:{min:120000,max:160000,currency:"USD"}, employmentType:"Full-time", applyUrl:"https://careers.ibm.com", postedAt:new Date(Date.now()-4*86400000), description:`IBM is seeking a Senior Salesforce Developer for a global client engagement.\n\nResponsibilities:\n• Lead complex Salesforce feature development\n• Architect REST API integrations\n• Optimise SOQL and Apex for performance\n• Produce technical design documents\n\nRequirements:\n• 3-6 years Salesforce development\n• Expert Apex, LWC, REST API skills\n• Platform Developer II preferred` },
    { title:"Salesforce Business Analyst", location:"Mumbai, India", country:"India", workMode:"Hybrid", experienceLevel:"Mid", roleCategory:"Business Analyst", skills:["Requirements","User Stories","JIRA","Agile"], salary:{min:900000,max:1400000,currency:"INR"}, employmentType:"Full-time", applyUrl:"https://careers.infosys.com", postedAt:new Date(Date.now()-6*86400000), description:`Infosys is looking for a Salesforce BA to bridge business and technology.\n\nResponsibilities:\n• Elicit and document business requirements\n• Create user stories and functional specs\n• Facilitate stakeholder workshops\n• Support UAT and change management\n\nRequirements:\n• 3+ years as BA on Salesforce projects\n• Experience with JIRA and agile\n• Strong communication skills` },
    { title:"Salesforce Fresher Developer", location:"Bengaluru, India", country:"India", workMode:"Onsite", experienceLevel:"Fresher", roleCategory:"Developer", skills:["Apex","LWC","SOQL","Trailhead"], salary:{min:400000,max:650000,currency:"INR"}, employmentType:"Full-time", applyUrl:"https://careers.wipro.com", postedAt:new Date(Date.now()-7*86400000), description:`Wipro offers an exciting opportunity for fresh Salesforce developers.\n\nResponsibilities:\n• Develop on Salesforce under senior guidance\n• Work on Apex classes and LWC components\n• Write test classes and maintain code coverage\n\nRequirements:\n• 0-1 year experience, freshers welcome\n• PD1 certification or Trailhead Ranger status\n• Basic Apex, SOQL, and LWC knowledge` },
    { title:"Salesforce Lead Developer", location:"Gurugram, India", country:"India", workMode:"Hybrid", experienceLevel:"Lead", roleCategory:"Developer", skills:["Apex","LWC","DevOps","Architecture"], salary:{min:2200000,max:3200000,currency:"INR"}, employmentType:"Full-time", applyUrl:"https://careers.hcltech.com", postedAt:new Date(Date.now()-2*86400000), description:`HCL Technologies is looking for a Lead Salesforce Developer.\n\nResponsibilities:\n• Lead a team of 6 Salesforce developers\n• Architect scalable solutions\n• Conduct code reviews and enforce quality\n• Drive platform upgrades and release management\n\nRequirements:\n• 6+ years Salesforce development, 2+ as Lead\n• Strong DevOps and CI/CD experience\n• Application Architect certification preferred` },
    { title:"Salesforce CPQ Specialist", location:"Pune, India", country:"India", workMode:"Hybrid", experienceLevel:"Mid", roleCategory:"CPQ Specialist", skills:["CPQ","Steelbrick","Pricing Rules","ERP Integration"], salary:{min:1200000,max:2000000,currency:"INR"}, employmentType:"Full-time", applyUrl:"https://careers.mphasis.com", postedAt:new Date(Date.now()-3*86400000), description:`Mphasis is seeking a CPQ Specialist for a leading manufacturing client.\n\nResponsibilities:\n• Configure Salesforce CPQ for complex product catalogues\n• Build pricing rules, product bundles, and quote templates\n• Integrate CPQ with ERP systems\n• Train sales teams on CPQ usage\n\nRequirements:\n• 2-4 years CPQ experience\n• Salesforce CPQ Specialist certification required\n• Experience with advanced approval processes` },
  ];

  const withSlugs = dummy.map((j, i) => ({
    ...j,
    slug: slugify(`${j.title}-${j.location}-${i}`),
  }));

  await Job.insertMany(withSlugs);
  return { message: "10 dummy jobs seeded.", count: withSlugs.length };
}