import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield, BarChart3, Loader2, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CVEInput } from "@/components/cve/CVEInput";
import { CVECard } from "@/components/cve/CVECard";
import { ThreatOverview } from "@/components/cve/ThreatOverview";
import { CVEData } from "@/types/cve";
import {
  fetchCVEData,
  getStoredCVEs,
  addStoredCVE,
  removeStoredCVE,
  clearStoredCVEs,
} from "@/services/cveService";
import { useToast } from "@/hooks/use-toast";

export default function CVEAnalyzer() {
  const [cveList, setCveList] = useState<string[]>([]);
  const [cveData, setCveData] = useState<Record<string, CVEData>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const handleRemoveCVE = useCallback((cveId: string) => {
    removeStoredCVE(cveId);
    setCveList((prev) => prev.filter((id) => id !== cveId));
    setCveData((prev) => {
      const copy = { ...prev };
      delete copy[cveId];
      return copy;
    });
  }, []);

  const loadCVE = useCallback(async (cveId: string) => {
    setLoading((prev) => {
      if (prev[cveId]) return prev;
      return { ...prev, [cveId]: true };
    });
    
    try {
      const data = await fetchCVEData(cveId);
      
      if (data) {
        setCveData((prev) => {
          if (prev[cveId]) return prev;
          return { ...prev, [cveId]: data };
        });
      } else {
        toast({
          title: "CVE Not Found",
          description: `Could not find data for ${cveId}`,
          variant: "destructive",
        });
        handleRemoveCVE(cveId);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to fetch ${cveId}`,
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, [cveId]: false }));
    }
  }, [toast, handleRemoveCVE]);

  // Load stored CVEs on mount
  useEffect(() => {
    const stored = getStoredCVEs();
    setCveList(stored);
    
    // Fetch data for stored CVEs
    stored.forEach((cveId) => {
      loadCVE(cveId);
    });
  }, [loadCVE]);

  const handleAddCVE = (cveId: string) => {
    if (cveList.includes(cveId)) {
      toast({
        title: "Already Added",
        description: `${cveId} is already in your list`,
      });
      return;
    }
    
    addStoredCVE(cveId);
    setCveList((prev) => [...prev, cveId]);
    loadCVE(cveId);
  };

  const handleAddMultiple = (cveIds: string[]) => {
    const newIds = cveIds.filter((id) => !cveList.includes(id));
    
    newIds.forEach((id) => {
      addStoredCVE(id);
    });
    
    setCveList((prev) => [...prev, ...newIds]);
    
    // Load data with delay to avoid rate limiting
    newIds.forEach((id, index) => {
      setTimeout(() => loadCVE(id), index * 1000);
    });
  };

  const handleClearAll = () => {
    clearStoredCVEs();
    setCveList([]);
    setCveData({});
  };

  const isAnyLoading = Object.values(loading).some(Boolean);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to NIRD</span>
              </Link>
              <div className="h-6 w-px bg-border" />
              <h1 className="text-xl font-bold text-primary flex items-center gap-2">
                <Shield className="w-5 h-5" />
                CVE Analyzer
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="analysis" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              CVE Analysis
            </TabsTrigger>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Threat Overview
            </TabsTrigger>
          </TabsList>

          {/* CVE Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
              <h2 className="text-lg font-semibold mb-4">Add CVE to Analyze</h2>
              <CVEInput
                onAddCVE={handleAddCVE}
                onAddMultiple={handleAddMultiple}
                isLoading={isAnyLoading}
              />
            </div>

            {/* CVE List */}
            {cveList.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    Your CVEs ({cveList.length})
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAll}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
                </div>

                <div className="grid gap-4">
                  {cveList.map((cveId) => (
                    <div key={cveId}>
                      {loading[cveId] ? (
                        <div className="bg-card border border-border rounded-lg p-6 flex items-center justify-center gap-3">
                          <Loader2 className="w-5 h-5 animate-spin text-primary" />
                          <span className="text-muted-foreground">
                            Loading {cveId}...
                          </span>
                        </div>
                      ) : cveData[cveId] ? (
                        <CVECard
                          cve={cveData[cveId]}
                          onRemove={handleRemoveCVE}
                        />
                      ) : (
                        <div className="bg-card border border-border rounded-lg p-6 text-center text-muted-foreground">
                          Failed to load {cveId}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {cveList.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Shield className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-medium mb-2">No CVEs Added</h3>
                <p className="text-sm">
                  Enter a CVE ID above or import from a file to start analyzing
                  vulnerabilities
                </p>
              </div>
            )}
          </TabsContent>

          {/* Threat Overview Tab */}
          <TabsContent value="overview">
            <ThreatOverview />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-4">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          Data from NVD (National Vulnerability Database), FIRST EPSS, and CISA
          KEV
        </div>
      </footer>
    </div>
  );
}
