export type CheckType = "API" | "AUTH" | "DATA";
export type CheckStatus = "PASSED" | "WARNING" | "FAILED";
export type ReportStatus = "OK" | "WARNING" | "FAILED";

export interface CheckResult {
  name: string;
  type: CheckType;
  status: CheckStatus;
  responseTimeMs: number;
  message: string;
  details?: Record<string, unknown>;
}

export interface MonitoringReport {
  generatedAt: string;
  environment: "production";
  status: ReportStatus;
  checks: CheckResult[];
  totals: {
    total: number;
    passed: number;
    warning: number;
    failed: number;
  };
}
