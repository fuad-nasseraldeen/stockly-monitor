import type { CheckResult, MonitoringReport } from "./types";

const aggregateTotals = (checks: CheckResult[]) => {
  return checks.reduce(
    (acc, check) => {
      acc.total += 1;
      if (check.status === "PASSED") acc.passed += 1;
      if (check.status === "WARNING") acc.warning += 1;
      if (check.status === "FAILED") acc.failed += 1;
      return acc;
    },
    { total: 0, passed: 0, warning: 0, failed: 0 }
  );
};

export const buildReport = (checks: CheckResult[]): MonitoringReport => {
  return {
    generatedAt: new Date().toISOString(),
    environment: "production",
    checks,
    totals: aggregateTotals(checks)
  };
};

export const printSummary = (report: MonitoringReport): void => {
  console.log("Stockly Monitoring Summary");
  console.log("==========================");

  for (const check of report.checks) {
    console.log(
      `[${check.status}] ${check.name} (${check.type}) - ${check.responseTimeMs}ms - ${check.message}`
    );
  }

  console.log("--------------------------");
  console.log(
    `Totals: total=${report.totals.total}, passed=${report.totals.passed}, warning=${report.totals.warning}, failed=${report.totals.failed}`
  );
};