import { CVEData, AffectedProduct, KEVData, ThreatOverviewData } from "@/types/cve";

const NVD_API_BASE = "https://services.nvd.nist.gov/rest/json/cves/2.0";
const EPSS_API_BASE = "https://api.first.org/data/v1/epss";
const KEV_API = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json";

// Cache for KEV data
let kevCache: { cves: string[]; data: Record<string, KEVData> } | null = null;

// CWE name mapping (common ones)
const CWE_NAMES: Record<string, string> = {
  "CWE-79": "Cross-site Scripting (XSS)",
  "CWE-89": "SQL Injection",
  "CWE-20": "Improper Input Validation",
  "CWE-22": "Path Traversal",
  "CWE-78": "OS Command Injection",
  "CWE-94": "Code Injection",
  "CWE-119": "Buffer Overflow",
  "CWE-125": "Out-of-bounds Read",
  "CWE-200": "Information Exposure",
  "CWE-264": "Permissions, Privileges, Access Control",
  "CWE-287": "Improper Authentication",
  "CWE-352": "Cross-Site Request Forgery (CSRF)",
  "CWE-400": "Uncontrolled Resource Consumption",
  "CWE-416": "Use After Free",
  "CWE-434": "Unrestricted File Upload",
  "CWE-476": "NULL Pointer Dereference",
  "CWE-502": "Deserialization of Untrusted Data",
  "CWE-611": "XXE Injection",
  "CWE-787": "Out-of-bounds Write",
  "CWE-862": "Missing Authorization",
  "CWE-863": "Incorrect Authorization",
  "CWE-918": "Server-Side Request Forgery (SSRF)",
};

async function fetchKEVData(): Promise<{ cves: string[]; data: Record<string, KEVData> }> {
  if (kevCache) return kevCache;
  
  try {
    const response = await fetch(KEV_API);
    const data = await response.json();
    
    const cves: string[] = [];
    const kevData: Record<string, KEVData> = {};
    
    for (const vuln of data.vulnerabilities || []) {
      cves.push(vuln.cveID);
      kevData[vuln.cveID] = {
        dateAdded: vuln.dateAdded,
        dueDate: vuln.dueDate,
        requiredAction: vuln.requiredAction,
        knownRansomwareCampaignUse: vuln.knownRansomwareCampaignUse,
      };
    }
    
    kevCache = { cves, data: kevData };
    return kevCache;
  } catch (error) {
    console.error("Failed to fetch KEV data:", error);
    return { cves: [], data: {} };
  }
}

async function fetchEPSSData(cveId: string): Promise<{ score: number; percentile: number } | null> {
  try {
    const response = await fetch(`${EPSS_API_BASE}?cve=${cveId}`);
    const data = await response.json();
    
    if (data.data && data.data.length > 0) {
      return {
        score: parseFloat(data.data[0].epss),
        percentile: parseFloat(data.data[0].percentile),
      };
    }
    return null;
  } catch (error) {
    console.error(`Failed to fetch EPSS for ${cveId}:`, error);
    return null;
  }
}

interface CpeMatch {
  criteria?: string;
}

interface ConfigNode {
  cpeMatch?: CpeMatch[];
}

interface Configuration {
  nodes?: ConfigNode[];
}

function extractAffectedProducts(configurations: Configuration[]): AffectedProduct[] {
  const products: AffectedProduct[] = [];
  const seen = new Set<string>();
  
  for (const config of configurations || []) {
    for (const node of config.nodes || []) {
      for (const cpeMatch of node.cpeMatch || []) {
        const cpe = cpeMatch.criteria || "";
        const parts = cpe.split(":");
        if (parts.length >= 5) {
          const vendor = parts[3] || "unknown";
          const product = parts[4] || "unknown";
          const version = parts[5] || "*";
          const key = `${vendor}:${product}`;
          
          if (!seen.has(key)) {
            seen.add(key);
            products.push({
              vendor: vendor.replace(/_/g, " "),
              product: product.replace(/_/g, " "),
              versions: [version !== "*" ? version : "All versions"],
            });
          }
        }
      }
    }
  }
  
  return products.slice(0, 10); // Limit to 10 products
}

export async function fetchCVEData(cveId: string): Promise<CVEData | null> {
  try {
    // Normalize CVE ID
    const normalizedId = cveId.toUpperCase().trim();
    
    // Fetch NVD data
    const nvdResponse = await fetch(`${NVD_API_BASE}?cveId=${normalizedId}`);
    
    if (!nvdResponse.ok) {
      throw new Error(`NVD API returned ${nvdResponse.status}`);
    }
    
    const nvdData = await nvdResponse.json();
    
    if (!nvdData.vulnerabilities || nvdData.vulnerabilities.length === 0) {
      return null;
    }
    
    const vuln = nvdData.vulnerabilities[0].cve;
    
    // Extract CVSS data (prefer v3.1, then v3.0, then v2.0)
    let cvssScore: number | null = null;
    let cvssVector: string | null = null;
    let cvssSeverity: string | null = null;
    let impactScore: number | null = null;
    let exploitabilityScore: number | null = null;
    
    const metrics = vuln.metrics || {};
    
    if (metrics.cvssMetricV31 && metrics.cvssMetricV31.length > 0) {
      const cvss = metrics.cvssMetricV31[0];
      cvssScore = cvss.cvssData?.baseScore;
      cvssVector = cvss.cvssData?.vectorString;
      cvssSeverity = cvss.cvssData?.baseSeverity;
      impactScore = cvss.impactScore;
      exploitabilityScore = cvss.exploitabilityScore;
    } else if (metrics.cvssMetricV30 && metrics.cvssMetricV30.length > 0) {
      const cvss = metrics.cvssMetricV30[0];
      cvssScore = cvss.cvssData?.baseScore;
      cvssVector = cvss.cvssData?.vectorString;
      cvssSeverity = cvss.cvssData?.baseSeverity;
      impactScore = cvss.impactScore;
      exploitabilityScore = cvss.exploitabilityScore;
    } else if (metrics.cvssMetricV2 && metrics.cvssMetricV2.length > 0) {
      const cvss = metrics.cvssMetricV2[0];
      cvssScore = cvss.cvssData?.baseScore;
      cvssVector = cvss.cvssData?.vectorString;
      cvssSeverity = cvss.baseSeverity;
      impactScore = cvss.impactScore;
      exploitabilityScore = cvss.exploitabilityScore;
    }
    
    // Extract CWE IDs
    const cweIds: string[] = [];
    for (const weakness of vuln.weaknesses || []) {
      for (const desc of weakness.description || []) {
        if (desc.value && desc.value.startsWith("CWE-")) {
          cweIds.push(desc.value);
        }
      }
    }
    
    // Get CWE names
    const cweNames = cweIds.map(id => CWE_NAMES[id] || id);
    
    // Extract description
    let description = "";
    for (const desc of vuln.descriptions || []) {
      if (desc.lang === "en") {
        description = desc.value;
        break;
      }
    }
    
    // Extract references
    const references = (vuln.references || []).slice(0, 5).map((ref: { url: string; source?: string; tags?: string[] }) => ({
      url: ref.url,
      source: ref.source || "Unknown",
      tags: ref.tags || [],
    }));
    
    // Extract affected products
    const affectedProducts = extractAffectedProducts(vuln.configurations || []);
    
    // Fetch EPSS data
    const epssData = await fetchEPSSData(normalizedId);
    
    // Fetch KEV data
    const kev = await fetchKEVData();
    const isKnownExploited = kev.cves.includes(normalizedId);
    
    return {
      id: normalizedId,
      description,
      published: vuln.published,
      lastModified: vuln.lastModified,
      cvssScore,
      cvssVector,
      cvssSeverity,
      impactScore,
      exploitabilityScore,
      epssScore: epssData?.score ?? null,
      epssPercentile: epssData?.percentile ?? null,
      cweIds,
      cweNames,
      affectedProducts,
      references,
      isKnownExploited,
      kevData: isKnownExploited ? kev.data[normalizedId] : undefined,
    };
  } catch (error) {
    console.error(`Failed to fetch CVE ${cveId}:`, error);
    return null;
  }
}

export async function searchCVEs(keyword: string, daysBack: number): Promise<CVEData[]> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    
    const pubStartDate = startDate.toISOString().split(".")[0];
    const pubEndDate = endDate.toISOString().split(".")[0];
    
    const url = `${NVD_API_BASE}?keywordSearch=${encodeURIComponent(keyword)}&pubStartDate=${pubStartDate}&pubEndDate=${pubEndDate}&resultsPerPage=100`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`NVD API returned ${response.status}`);
    }
    
    const data = await response.json();
    const cves: CVEData[] = [];
    
    // Fetch KEV data once
    const kev = await fetchKEVData();
    
    for (const vuln of (data.vulnerabilities || []).slice(0, 50)) {
      const cve = vuln.cve;
      const cveId = cve.id;
      
      // Extract CVSS
      let cvssScore: number | null = null;
      let cvssSeverity: string | null = null;
      let impactScore: number | null = null;
      let exploitabilityScore: number | null = null;
      
      const metrics = cve.metrics || {};
      
      if (metrics.cvssMetricV31?.[0]) {
        const cvss = metrics.cvssMetricV31[0];
        cvssScore = cvss.cvssData?.baseScore;
        cvssSeverity = cvss.cvssData?.baseSeverity;
        impactScore = cvss.impactScore;
        exploitabilityScore = cvss.exploitabilityScore;
      } else if (metrics.cvssMetricV30?.[0]) {
        const cvss = metrics.cvssMetricV30[0];
        cvssScore = cvss.cvssData?.baseScore;
        cvssSeverity = cvss.cvssData?.baseSeverity;
        impactScore = cvss.impactScore;
        exploitabilityScore = cvss.exploitabilityScore;
      } else if (metrics.cvssMetricV2?.[0]) {
        const cvss = metrics.cvssMetricV2[0];
        cvssScore = cvss.cvssData?.baseScore;
        cvssSeverity = cvss.baseSeverity;
        impactScore = cvss.impactScore;
        exploitabilityScore = cvss.exploitabilityScore;
      }
      
      // Extract CWE
      const cweIds: string[] = [];
      for (const weakness of cve.weaknesses || []) {
        for (const desc of weakness.description || []) {
          if (desc.value?.startsWith("CWE-")) {
            cweIds.push(desc.value);
          }
        }
      }
      
      // Extract description
      let description = "";
      for (const desc of cve.descriptions || []) {
        if (desc.lang === "en") {
          description = desc.value;
          break;
        }
      }
      
      const isKnownExploited = kev.cves.includes(cveId);
      
      cves.push({
        id: cveId,
        description,
        published: cve.published,
        lastModified: cve.lastModified,
        cvssScore,
        cvssVector: null,
        cvssSeverity,
        impactScore,
        exploitabilityScore,
        epssScore: null,
        epssPercentile: null,
        cweIds,
        cweNames: cweIds.map(id => CWE_NAMES[id] || id),
        affectedProducts: extractAffectedProducts(cve.configurations || []),
        references: [],
        isKnownExploited,
        kevData: isKnownExploited ? kev.data[cveId] : undefined,
      });
    }
    
    return cves;
  } catch (error) {
    console.error("Failed to search CVEs:", error);
    return [];
  }
}

export async function getThreatOverview(keyword: string, days: number): Promise<ThreatOverviewData> {
  const cves = await searchCVEs(keyword, days);
  
  // Calculate statistics
  const cvsScores = cves.filter(c => c.cvssScore !== null).map(c => c.cvssScore!);
  const averageCVSS = cvsScores.length > 0 ? cvsScores.reduce((a, b) => a + b, 0) / cvsScores.length : 0;
  
  // Sort by CVSS
  const topCVSSCVEs = [...cves]
    .filter(c => c.cvssScore !== null)
    .sort((a, b) => (b.cvssScore || 0) - (a.cvssScore || 0))
    .slice(0, 10);
  
  // Count CWEs
  const cweCounts: Record<string, number> = {};
  for (const cve of cves) {
    for (const cweId of cve.cweIds) {
      cweCounts[cweId] = (cweCounts[cweId] || 0) + 1;
    }
  }
  
  let mostFrequentCWE: { id: string; name: string; count: number } | null = null;
  let maxCount = 0;
  for (const [id, count] of Object.entries(cweCounts)) {
    if (count > maxCount) {
      maxCount = count;
      mostFrequentCWE = { id, name: CWE_NAMES[id] || id, count };
    }
  }
  
  // Count exploited
  const exploitedCount = cves.filter(c => c.isKnownExploited).length;
  
  // Severity distribution
  const severityCounts: Record<string, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  for (const cve of cves) {
    if (cve.cvssSeverity) {
      severityCounts[cve.cvssSeverity] = (severityCounts[cve.cvssSeverity] || 0) + 1;
    }
  }
  
  const severityDistribution = Object.entries(severityCounts).map(([severity, count]) => ({
    severity,
    count,
  }));
  
  // CVSS trend by week
  const trendMap: Record<string, number[]> = {};
  for (const cve of cves) {
    if (cve.published && cve.cvssScore !== null) {
      const week = cve.published.substring(0, 10);
      if (!trendMap[week]) trendMap[week] = [];
      trendMap[week].push(cve.cvssScore);
    }
  }
  
  const cvssTrend = Object.entries(trendMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, scores]) => ({
      date,
      avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
    }));
  
  return {
    keyword,
    period: `${days} days`,
    totalCVEs: cves.length,
    topCVSSCVEs,
    topEPSSCVEs: [], // EPSS requires individual lookups, too slow for bulk
    averageCVSS: Math.round(averageCVSS * 10) / 10,
    averageEPSS: 0,
    mostFrequentCWE,
    exploitedCount,
    cvssTrend,
    severityDistribution,
  };
}

// Local storage helpers
const STORAGE_KEY = "nird_cve_list";

export function getStoredCVEs(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addStoredCVE(cveId: string): void {
  const cves = getStoredCVEs();
  const normalizedId = cveId.toUpperCase().trim();
  if (!cves.includes(normalizedId)) {
    cves.push(normalizedId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cves));
  }
}

export function removeStoredCVE(cveId: string): void {
  const cves = getStoredCVEs();
  const filtered = cves.filter(id => id !== cveId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function clearStoredCVEs(): void {
  localStorage.removeItem(STORAGE_KEY);
}
