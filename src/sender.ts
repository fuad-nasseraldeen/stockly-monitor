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

  console.log(`Report ingestion method: ${method}`);
  console.log(`Report ingestion STOCKLY_API_URL: ${baseURL}`);
  console.log(`Report ingestion path: ${normalizedPath}`);
  console.log(`Report ingestion URL: ${url}`);

  const response = await client.post(normalizedPath, report, {
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
