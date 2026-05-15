import type { AxiosInstance } from "axios";
import type { MonitoringReport } from "./types";

const toBodyText = (value: unknown): string => {
  if (typeof value === "string") {
    return value;
  }

  if (value === undefined || value === null) {
    return "";
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const toApiStatus = (status: string): "OK" | "WARNING" | "FAILED" => {
  if (status === "FAILED") return "FAILED";
  if (status === "WARNING") return "WARNING";
  return "OK";
};

export const postMonitoringReport = async (
  client: AxiosInstance,
  monitoringIngestSecret: string,
  monitoringReportPath: string,
  report: MonitoringReport
): Promise<{
  ok: boolean;
  status: number;
  bodyText: string;
  headers: Record<string, string>;
  url: string;
  path: string;
  baseUrl: string;
  method: "POST";
}> => {
  const method: "POST" = "POST";
  const normalizedPath = `/${monitoringReportPath.replace(/^\/+/, "")}`;
  const baseURL = (client.defaults.baseURL ?? "").replace(/\/+$/, "");
  const url = `${baseURL}${normalizedPath}`;
  const apiReport = {
    ...report,
    status: toApiStatus(report.status),
    checks: report.checks.map((check) => ({
      ...check,
      status: toApiStatus(check.status)
    }))
  };

  console.log(`Report ingestion method: ${method}`);
  console.log(`Report ingestion STOCKLY_API_URL: ${baseURL}`);
  console.log(`Report ingestion path: ${normalizedPath}`);
  console.log(`Report ingestion URL: ${url}`);
  console.log(`Report payload top-level status: ${apiReport.status}`);
  console.log(
    `Report payload check statuses: ${Array.from(new Set(apiReport.checks.map((check) => check.status))).join(", ")}`
  );
  console.log("Report payload JSON (debug):");
  console.log(JSON.stringify(apiReport, null, 2));

  const response = await client.post(normalizedPath, apiReport, {
    headers: {
      "x-monitoring-secret": monitoringIngestSecret
    }
  });

  return {
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
    bodyText: toBodyText(response.data),
    headers: response.headers as Record<string, string>,
    url,
    path: normalizedPath,
    baseUrl: baseURL,
    method
  };
};
