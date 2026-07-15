export const LEVER_COMPANIES = [
  { company: "Netflix", handle: "netflix" },
  { company: "Shopify", handle: "shopify" },
  { company: "Brex", handle: "brex" },
  { company: "Ramp", handle: "ramp" },
  { company: "Vercel", handle: "vercel" },
  { company: "Linear", handle: "linear" },

  { company: "Mixpanel", handle: "mixpanel" },
  { company: "Postman", handle: "postman" },
  { company: "Miro", handle: "miro" },
  { company: "BrowserStack", handle: "browserstack" },
  { company: "Canva", handle: "canva" },
  { company: "Sourcegraph", handle: "sourcegraph" },
  { company: "Cockroach Labs", handle: "cockroachlabs" },
  { company: "Snyk", handle: "snyk" },
  { company: "CircleCI", handle: "circleci" },
  { company: "LaunchDarkly", handle: "launchdarkly" },
  { company: "Contentful", handle: "contentful" },
  { company: "Gong", handle: "gong" },
  { company: "NerdWallet", handle: "nerdwallet" },
  { company: "Intercom", handle: "intercom" },
  { company: "Yelp", handle: "yelp" },
  { company: "Headspace", handle: "headspace" },
  { company: "Nextdoor", handle: "nextdoor" },
  { company: "MongoDB", handle: "mongodb" },
  { company: "Robinhood", handle: "robinhood" },
  { company: "CloudBees", handle: "cloudbees" },
  { company: "Lattice", handle: "lattice" },
  { company: "Drata", handle: "drata" },
  { company: "Fivetran", handle: "fivetran" },
  { company: "Heap", handle: "heap" },
  { company: "Pleo", handle: "pleo" },
  { company: "Aircall", handle: "aircall" },
  { company: "Zapier", handle: "zapier" },
  { company: "HashiCorp", handle: "hashicorp" },
  { company: "Pinecone", handle: "pinecone" },
  { company: "ClickHouse", handle: "clickhouse" },
  { company: "dbt Labs", handle: "dbtlabs" },
];

interface RawExternalJob {
  sourceId: string; source: string; title: string; companyName: string;
  location?: string; description: string; applyUrl: string; postedAt?: string;
}

export async function fetchFromLever(): Promise<RawExternalJob[]> {
  const results: RawExternalJob[] = [];

  for (const company of LEVER_COMPANIES) {
    try {
      const res = await fetch(`https://api.lever.co/v0/postings/${company}?mode=json`);
      if (!res.ok) continue;

      const data = await res.json();
      const jobs = (data || []).filter((j: any) =>
        j.text?.toLowerCase().includes("salesforce")
      );

      for (const j of jobs) {
        results.push({
          sourceId:    `lever-${j.id}`,
          source:      "Lever",
          title:       j.text,
          companyName: company.company,
          location:    j.categories?.location,
          description: (j.descriptionPlain || j.description || "").slice(0, 4000),
          applyUrl:    j.hostedUrl,
          postedAt:    j.createdAt ? new Date(j.createdAt).toISOString() : undefined,
        });
      }
    } catch {
      continue;
    }
  }

  return results;
}