export type Region = "Sub-Saharan Africa" | "South Asia";

export type RiskLevel = "Low" | "Medium" | "High";

export type SkillCategory = "technical" | "interpersonal" | "entrepreneurial";

export type SkillBucket = "at_risk" | "durable" | "emerging";

export interface ProfileSkill {
  name: string;
  category: SkillCategory;
  bucket: SkillBucket;
  isco?: string;
  /** Plain-language explanation surfaced as a tooltip. */
  meaning: string;
}

export interface Opportunity {
  id: string;
  title: string;
  type: "Formal job" | "Gig" | "Freelance" | "Training" | "Fellowship";
  employer: string;
  matchScore: number; // 0-100
  reach: "Within reach" | "Stretch" | "Aspirational";
  wageRange: string; // ILOSTAT-derived
  sectorGrowth: string; // econometric signal #1
  wageFloor: string; // econometric signal #2
  whyMatched: string;
  skillGap?: string[];
}

export interface ShiftSignal {
  year: number;
  label: string;
  detail: string;
}

export interface AdjacentSkill {
  name: string;
  effect: string;
}

export interface AggregateBucket {
  label: string;
  supply: number; // % of users with this skill
  demand: number; // % of employer postings asking for it
}

export interface RegionEconometrics {
  neet: string;
  sectorTrend: string;
  wageFloor: string;
  source: string;
}

export interface CountryConfig {
  region: Region;
  country: string;
  dataSource: string;
  educationTaxonomy: string;
  language: string;
  calibration: "LMIC urban" | "LMIC rural" | "Other";
  enabledOpportunityTypes: Opportunity["type"][];
}

export interface SkillPassport {
  region: Region;
  country: string;
  informal_input: string;
  formal_skills: string[];
  isco_matched_roles: string[];
  automation_risk_level: RiskLevel;
  automation_analysis: string;
  econometric_signal: string;
  skills: ProfileSkill[];
  shifts: ShiftSignal[];
  adjacentSkills: AdjacentSkill[];
  opportunities: Opportunity[];
}

export const PASSPORTS: Record<Region, SkillPassport> = {
  "Sub-Saharan Africa": {
    region: "Sub-Saharan Africa",
    country: "Ghana",
    informal_input: "I fix broken phone screens and watch python tutorials on youtube.",
    formal_skills: ["Hardware Diagnostics", "Basic Scripting (Python)", "Customer Triage"],
    isco_matched_roles: [
      "ICT User Support Technician (ISCO 3512)",
      "Electronics Mechanic (ISCO 7421)",
    ],
    automation_risk_level: "Medium",
    automation_analysis:
      "While routine coding faces high disruption, physical hardware repair maintains a durable wage floor due to manual dexterity requirements.",
    econometric_signal: "ICT sector employment growing at 4.2% annually in urban hubs.",
    skills: [
      {
        name: "Hardware Diagnostics",
        category: "technical",
        bucket: "durable",
        isco: "7421",
        meaning: "Physically diagnosing and replacing components — hard to automate without robotics.",
      },
      {
        name: "Basic Python Scripting",
        category: "technical",
        bucket: "at_risk",
        isco: "2512",
        meaning: "Routine code generation is increasingly handled by AI copilots.",
      },
      {
        name: "Customer Triage",
        category: "interpersonal",
        bucket: "durable",
        meaning: "Listening and de-escalation — anchored in human trust.",
      },
      {
        name: "Tool Resourcefulness",
        category: "entrepreneurial",
        bucket: "emerging",
        meaning: "Combining cheap parts and online tutorials into a viable repair business.",
      },
      {
        name: "AI-Assisted Debugging",
        category: "technical",
        bucket: "emerging",
        meaning: "Working alongside LLMs to fix code is a fast-growing complement to repair work.",
      },
    ],
    shifts: [
      {
        year: 2030,
        label: "Repair-as-a-service expands",
        detail: "Wittgenstein Centre projects a 38% rise in urban informal services demand in West Africa.",
      },
      {
        year: 2035,
        label: "ICT support roles formalize",
        detail: "ILO baseline shows ISCO 3512 absorbing ~120k new entrants across SSA cities.",
      },
    ],
    adjacentSkills: [
      { name: "Mobile Network Troubleshooting", effect: "Lifts match score for ICT Support roles by ~14 pts." },
      { name: "Customer CRM (HubSpot/Zoho)", effect: "Moves you from Medium to Low automation risk." },
    ],
    opportunities: [
      {
        id: "ssa-1",
        title: "Field Repair Technician",
        type: "Formal job",
        employer: "MTN Service Centers, Accra",
        matchScore: 86,
        reach: "Within reach",
        wageRange: "GHS 1,800 – 2,600 / mo",
        sectorGrowth: "ICT services +4.2% YoY",
        wageFloor: "Above sector median (ILOSTAT)",
        whyMatched: "Hardware Diagnostics + Customer Triage map directly to ISCO 7421.",
      },
      {
        id: "ssa-2",
        title: "Junior Python Automation Gig",
        type: "Gig",
        employer: "Andela Talent Cloud",
        matchScore: 64,
        reach: "Stretch",
        wageRange: "USD 6 – 12 / hr",
        sectorGrowth: "Remote dev demand +9.1% YoY",
        wageFloor: "Above urban informal floor",
        whyMatched: "Python scripting overlaps with junior automation tasks.",
        skillGap: ["Git workflow basics", "Async API testing"],
      },
      {
        id: "ssa-3",
        title: "Tech Support Apprenticeship",
        type: "Training",
        employer: "GIZ Skills Initiative",
        matchScore: 78,
        reach: "Within reach",
        wageRange: "Stipend GHS 900 / mo",
        sectorGrowth: "Apprentice placements +12% YoY",
        wageFloor: "Stipend covers urban transit + meals",
        whyMatched: "Targets exactly your ISCO 3512 trajectory.",
      },
      {
        id: "ssa-4",
        title: "Digital Repair Cooperative Fellow",
        type: "Fellowship",
        employer: "Mozilla Africa Mradi",
        matchScore: 52,
        reach: "Aspirational",
        wageRange: "USD 1,200 / mo + grant",
        sectorGrowth: "Right-to-repair policy momentum",
        wageFloor: "3× local median wage",
        whyMatched: "Entrepreneurial bucket aligns with cooperative model.",
        skillGap: ["Public speaking", "Grant writing"],
      },
    ],
  },
  "South Asia": {
    region: "South Asia",
    country: "Bangladesh",
    informal_input:
      "I tailor clothes from home and learned graphic design on a borrowed laptop.",
    formal_skills: ["Garment Construction", "Adobe Suite Proficiency", "Client Brief Translation"],
    isco_matched_roles: [
      "Tailor / Dressmaker (ISCO 7531)",
      "Graphic & Multimedia Designer (ISCO 2166)",
    ],
    automation_risk_level: "Low",
    automation_analysis:
      "Bespoke creative work resists automation; generative tools augment rather than replace skilled designers in localized markets.",
    econometric_signal: "Creative services exports grew 6.8% YoY across South Asian metros.",
    skills: [
      {
        name: "Bespoke Garment Construction",
        category: "technical",
        bucket: "durable",
        isco: "7531",
        meaning: "Hand-finished tailoring — automation lags far behind on small-batch fit work.",
      },
      {
        name: "Adobe Suite Proficiency",
        category: "technical",
        bucket: "emerging",
        isco: "2166",
        meaning: "Now augmented by generative tools; demand growing for hybrid designers.",
      },
      {
        name: "Client Brief Translation",
        category: "interpersonal",
        bucket: "durable",
        meaning: "Turning vague wishes into a concrete spec — a uniquely human skill.",
      },
      {
        name: "Home-Studio Operations",
        category: "entrepreneurial",
        bucket: "emerging",
        meaning: "Running a micro-business from a single room — increasingly common income path.",
      },
      {
        name: "Mass-produced Pattern Cutting",
        category: "technical",
        bucket: "at_risk",
        meaning: "Standard pattern work is moving to CAD + automated cutters.",
      },
    ],
    shifts: [
      {
        year: 2030,
        label: "Creative services localize",
        detail: "Wittgenstein Centre projects 24% rise in South Asian metro creative-services workforce.",
      },
      {
        year: 2035,
        label: "Hybrid designer becomes norm",
        detail: "ILO baseline: ISCO 2166 roles requiring AI-tool literacy reach 70% of postings.",
      },
    ],
    adjacentSkills: [
      { name: "Generative AI for moodboards", effect: "Doubles project throughput for freelance design." },
      { name: "E-commerce product photography", effect: "Lifts match score for online marketplace gigs by ~18 pts." },
    ],
    opportunities: [
      {
        id: "sa-1",
        title: "Boutique Pattern Designer",
        type: "Formal job",
        employer: "Aarong, Dhaka",
        matchScore: 81,
        reach: "Within reach",
        wageRange: "BDT 28k – 42k / mo",
        sectorGrowth: "Apparel design +5.6% YoY",
        wageFloor: "Above Dhaka urban median",
        whyMatched: "Garment Construction + Adobe Suite map to ISCO 7531/2166 hybrid.",
      },
      {
        id: "sa-2",
        title: "Freelance Brand Identity Designer",
        type: "Freelance",
        employer: "Upwork / Fiverr",
        matchScore: 73,
        reach: "Within reach",
        wageRange: "USD 8 – 25 / hr",
        sectorGrowth: "Creative gig demand +6.8% YoY",
        wageFloor: "Above informal urban floor",
        whyMatched: "Adobe Suite + Client Brief Translation are core to brand work.",
        skillGap: ["Portfolio site setup"],
      },
      {
        id: "sa-3",
        title: "Generative Design Bootcamp",
        type: "Training",
        employer: "BRAC Skills Development",
        matchScore: 88,
        reach: "Within reach",
        wageRange: "Free + stipend BDT 6k / mo",
        sectorGrowth: "AI-creative roles +14% YoY",
        wageFloor: "Stipend covers transit",
        whyMatched: "Pushes Emerging skills into Durable territory.",
      },
      {
        id: "sa-4",
        title: "South Asia Creators Fellowship",
        type: "Fellowship",
        employer: "Goethe-Institut Bangladesh",
        matchScore: 48,
        reach: "Aspirational",
        wageRange: "EUR 1,400 / mo + grant",
        sectorGrowth: "Cross-border creative grants +22% YoY",
        wageFloor: "4× local median wage",
        whyMatched: "Home-Studio Operations signals founder potential.",
        skillGap: ["English writing", "Grant proposal structure"],
      },
    ],
  },
};

export const REGION_ECONOMETRICS: Record<Region, RegionEconometrics> = {
  "Sub-Saharan Africa": {
    neet: "Youth NEET rate: 22.4% (ILOSTAT, 2024)",
    sectorTrend: "ICT services employment +4.2% YoY",
    wageFloor: "Urban informal wage floor: GHS 1,200 / mo",
    source: "World Bank WDI · ILOSTAT · Wittgenstein Centre",
  },
  "South Asia": {
    neet: "Youth NEET rate: 28.1% (ILOSTAT, 2024)",
    sectorTrend: "Creative services employment +6.8% YoY",
    wageFloor: "Urban informal wage floor: BDT 9,500 / mo",
    source: "World Bank WDI · ILOSTAT · Wittgenstein Centre",
  },
};

export const COUNTRY_CONFIGS: Record<Region, CountryConfig> = {
  "Sub-Saharan Africa": {
    region: "Sub-Saharan Africa",
    country: "Ghana",
    dataSource: "ILO Ghana labour force module + WDI",
    educationTaxonomy: "Ghana NQF (BECE → SHS → Tertiary)",
    language: "English (Ghana) · Twi script supported",
    calibration: "LMIC urban",
    enabledOpportunityTypes: ["Formal job", "Gig", "Training", "Fellowship"],
  },
  "South Asia": {
    region: "South Asia",
    country: "Bangladesh",
    dataSource: "WDI Bangladesh + BBS labour survey",
    educationTaxonomy: "Bangladesh NQF (SSC → HSC → Tertiary)",
    language: "Bangla · English bilingual",
    calibration: "LMIC urban",
    enabledOpportunityTypes: ["Formal job", "Freelance", "Training", "Fellowship"],
  },
};

export const AGGREGATE_SUPPLY_DEMAND: Record<Region, AggregateBucket[]> = {
  "Sub-Saharan Africa": [
    { label: "Hardware Diagnostics", supply: 38, demand: 52 },
    { label: "Customer Service", supply: 64, demand: 41 },
    { label: "Python / Scripting", supply: 22, demand: 47 },
    { label: "Mobile Network Troubleshooting", supply: 14, demand: 38 },
    { label: "Digital Marketing", supply: 31, demand: 44 },
    { label: "AI-Assisted Workflow", supply: 9, demand: 35 },
  ],
  "South Asia": [
    { label: "Garment Construction", supply: 58, demand: 36 },
    { label: "Adobe Suite", supply: 41, demand: 55 },
    { label: "Generative AI Tools", supply: 12, demand: 49 },
    { label: "English Communication", supply: 47, demand: 62 },
    { label: "E-commerce Operations", supply: 24, demand: 51 },
    { label: "Pattern CAD", supply: 18, demand: 34 },
  ],
};