import { CVEData } from "@/types/cve";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, Bug, ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CVECardProps {
  cve: CVEData;
  onRemove?: (id: string) => void;
}

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

function getScoreColor(score: number | null): string {
  if (score === null) return "text-muted-foreground";
  if (score >= 9) return "text-destructive";
  if (score >= 7) return "text-accent";
  if (score >= 4) return "text-primary";
  return "text-secondary";
}

export function CVECard({ cve, onRemove }: CVECardProps) {
  return (
    <Card className="border-border bg-card hover:border-primary/50 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <CardTitle className="text-lg font-mono text-primary">{cve.id}</CardTitle>
            {cve.cvssSeverity && (
              <Badge className={getSeverityColor(cve.cvssSeverity)}>
                {cve.cvssSeverity}
              </Badge>
            )}
            {cve.isKnownExploited && (
              <Badge className="bg-destructive text-destructive-foreground gap-1">
                <AlertTriangle className="w-3 h-3" />
                KEV
              </Badge>
            )}
          </div>
          {onRemove && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemove(cve.id)}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Scores */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">CVSS</div>
            <div className={`text-2xl font-bold ${getScoreColor(cve.cvssScore)}`}>
              {cve.cvssScore?.toFixed(1) ?? "N/A"}
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Impact</div>
            <div className={`text-2xl font-bold ${getScoreColor(cve.impactScore)}`}>
              {cve.impactScore?.toFixed(1) ?? "N/A"}
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Exploitability</div>
            <div className={`text-2xl font-bold ${getScoreColor(cve.exploitabilityScore)}`}>
              {cve.exploitabilityScore?.toFixed(1) ?? "N/A"}
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">EPSS</div>
            <div className={`text-2xl font-bold ${cve.epssScore ? "text-accent" : "text-muted-foreground"}`}>
              {cve.epssScore ? `${(cve.epssScore * 100).toFixed(1)}%` : "N/A"}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-foreground/80 line-clamp-3">{cve.description}</p>

        {/* CWEs */}
        {cve.cweIds.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Bug className="w-4 h-4 text-muted-foreground mt-0.5" />
            {cve.cweNames.map((name, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {cve.cweIds[i]}: {name}
              </Badge>
            ))}
          </div>
        )}

        {/* Affected Products */}
        {cve.affectedProducts.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="w-4 h-4" />
              Affected Products
            </div>
            <div className="flex flex-wrap gap-1">
              {cve.affectedProducts.slice(0, 5).map((product, i) => (
                <Badge key={i} variant="secondary" className="text-xs capitalize">
                  {product.vendor} {product.product}
                </Badge>
              ))}
              {cve.affectedProducts.length > 5 && (
                <Badge variant="secondary" className="text-xs">
                  +{cve.affectedProducts.length - 5} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* KEV Info */}
        {cve.kevData && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 space-y-1">
            <div className="text-sm font-medium text-destructive flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Known Exploited Vulnerability
            </div>
            <p className="text-xs text-foreground/80">{cve.kevData.requiredAction}</p>
            <div className="text-xs text-muted-foreground">
              Due Date: {new Date(cve.kevData.dueDate).toLocaleDateString()}
            </div>
          </div>
        )}

        {/* References */}
        {cve.references.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {cve.references.slice(0, 3).map((ref, i) => (
              <a
                key={i}
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                {ref.source}
              </a>
            ))}
          </div>
        )}

        {/* Dates */}
        <div className="text-xs text-muted-foreground">
          Published: {new Date(cve.published).toLocaleDateString()} | 
          Modified: {new Date(cve.lastModified).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
}
