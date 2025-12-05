import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThreatOverviewData } from "@/types/cve";
import { getThreatOverview } from "@/services/cveService";
import { useToast } from "@/hooks/use-toast";
import { Search, Loader2, TrendingUp, Shield, AlertTriangle, Bug, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const PERIOD_OPTIONS = [
  { value: "30", label: "1 Month" },
  { value: "90", label: "3 Months" },
  { value: "180", label: "6 Months" },
  { value: "365", label: "1 Year" },
];

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "hsl(0, 70%, 50%)",
  HIGH: "hsl(25, 70%, 50%)",
  MEDIUM: "hsl(45, 85%, 55%)",
  LOW: "hsl(150, 40%, 35%)",
};

function getSeverityColor(severity: string | null): string {
  switch (severity?.toUpperCase()) {
    case "CRITICAL":
      return "bg-destructive text-destructive-foreground";
    case "HIGH":
      return "bg-accent text-accent-foreground";
    case "MEDIUM":
      return "bg-primary text-primary-foreground";
    case "LOW":
      return "bg-secondary text-secondary-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function ThreatOverview() {
  const [keyword, setKeyword] = useState("");
  const [period, setPeriod] = useState("90");
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<ThreatOverviewData | null>(null);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!keyword.trim()) {
      toast({
        title: "Keyword Required",
        description: "Please enter a vendor or product keyword",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await getThreatOverview(keyword.trim(), parseInt(period));
      setData(result);
      
      if (result.totalCVEs === 0) {
        toast({
          title: "No Results",
          description: "No CVEs found for this keyword and period",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch threat overview",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            Threat Overview Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Vendor or product (e.g., Microsoft, Oracle, Apache)"
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              Analyze
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {data && (
        <div className="space-y-6 animate-fade-up">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-border bg-card">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-primary">{data.totalCVEs}</div>
                <div className="text-sm text-muted-foreground">Total CVEs</div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-accent">{data.averageCVSS}</div>
                <div className="text-sm text-muted-foreground">Avg CVSS</div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-destructive">{data.exploitedCount}</div>
                <div className="text-sm text-muted-foreground">Known Exploited</div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardContent className="p-4 text-center">
                <div className="text-lg font-bold text-secondary truncate">
                  {data.mostFrequentCWE?.id || "N/A"}
                </div>
                <div className="text-sm text-muted-foreground">Top CWE</div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Severity Distribution */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Severity Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={data.severityDistribution.filter(s => s.count > 0)}
                      dataKey="count"
                      nameKey="severity"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      label={({ severity, count }) => `${severity}: ${count}`}
                      labelLine={false}
                    >
                      {data.severityDistribution.map((entry, index) => (
                        <Cell key={index} fill={SEVERITY_COLORS[entry.severity] || "#888"} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* CVSS Trend */}
            {data.cvssTrend.length > 1 && (
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    CVSS Trend Over Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={data.cvssTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(35, 20%, 22%)" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fill: "hsl(35, 15%, 55%)", fontSize: 10 }}
                        tickFormatter={(v) => v.substring(5)}
                      />
                      <YAxis 
                        domain={[0, 10]} 
                        tick={{ fill: "hsl(35, 15%, 55%)", fontSize: 10 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(35, 20%, 14%)", 
                          border: "1px solid hsl(35, 20%, 22%)",
                          borderRadius: "8px"
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="avgScore" 
                        stroke="hsl(45, 85%, 55%)" 
                        strokeWidth={2}
                        dot={{ fill: "hsl(45, 85%, 55%)" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Top 10 CVSS */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-destructive" />
                Top 10 Highest CVSS Vulnerabilities
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.topCVSSCVEs.length > 0 ? (
                <div className="space-y-3">
                  {data.topCVSSCVEs.map((cve, i) => (
                    <div
                      key={cve.id}
                      className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                    >
                      <span className="text-2xl font-bold text-muted-foreground w-8">
                        #{i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-primary">{cve.id}</span>
                          {cve.cvssSeverity && (
                            <Badge className={getSeverityColor(cve.cvssSeverity)}>
                              {cve.cvssSeverity}
                            </Badge>
                          )}
                          {cve.isKnownExploited && (
                            <Badge className="bg-destructive text-destructive-foreground">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              KEV
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                          {cve.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-destructive">
                          {cve.cvssScore?.toFixed(1)}
                        </div>
                        <div className="text-xs text-muted-foreground">CVSS</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No vulnerabilities found with CVSS scores
                </p>
              )}
            </CardContent>
          </Card>

          {/* Most Frequent CWE */}
          {data.mostFrequentCWE && (
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bug className="w-5 h-5 text-accent" />
                  Most Frequent Weakness
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xl font-mono text-primary">
                      {data.mostFrequentCWE.id}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {data.mostFrequentCWE.name}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-accent">
                      {data.mostFrequentCWE.count}
                    </div>
                    <div className="text-xs text-muted-foreground">occurrences</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
