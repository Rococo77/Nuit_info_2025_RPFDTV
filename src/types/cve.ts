export interface CVEData {
  id: string;
  description: string;
  published: string;
  lastModified: string;
  cvssScore: number | null;
  cvssVector: string | null;
  cvssSeverity: string | null;
  impactScore: number | null;
  exploitabilityScore: number | null;
  epssScore: number | null;
  epssPercentile: number | null;
  cweIds: string[];
  cweNames: string[];
  affectedProducts: AffectedProduct[];
  references: Reference[];
  isKnownExploited: boolean;
  kevData?: KEVData;
}

export interface AffectedProduct {
  vendor: string;
  product: string;
  versions: string[];
}

export interface Reference {
  url: string;
  source: string;
  tags: string[];
}

export interface KEVData {
  dateAdded: string;
  dueDate: string;
  requiredAction: string;
  knownRansomwareCampaignUse: string;
}

export interface ThreatOverviewData {
  keyword: string;
  period: string;
  totalCVEs: number;
  topCVSSCVEs: CVEData[];
  topEPSSCVEs: CVEData[];
  averageCVSS: number;
  averageEPSS: number;
  mostFrequentCWE: { id: string; name: string; count: number } | null;
  exploitedCount: number;
  cvssTrend: { date: string; avgScore: number }[];
  severityDistribution: { severity: string; count: number }[];
}

export interface StoredCVE {
  id: string;
  addedAt: string;
  data?: CVEData;
}
