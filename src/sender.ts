import { isAxiosError, type AxiosInstance } from "axios";
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

  console.log(`Report ingestion URL: ${url}`);

  try {
    const response = await client.post(normalizedPath, apiReport, {
      headers: {
        "x-monitoring-secret": monitoringIngestSecret
      }
    });

    const ok = response.status >= 200 && response.status < 300;
    const bodyText = toBodyText(response.data);

    if (!ok) {
      console.error(`Report ingestion failed with status ${response.status}`);
      console.error(`Report ingestion URL: ${url}`);
      console.error("Report ingestion response body:");
      console.error(bodyText);
    }

    return {
      ok,
      status: response.status,
      bodyText,
      headers: response.headers as Record<string, string>,
      url,
      path: normalizedPath,
      baseUrl: baseURL,
      method
    };
  } catch (error) {
    console.error(`Report ingestion failed for URL: ${url}`);

    if (isAxiosError(error)) {
      if (error.response) {
        console.error(`Axios error response status: ${error.response.status}`);
        console.error("Axios error response data:");
        console.error(toBodyText(error.response.data));
      } else {
        console.error(error.message);
      }
    } else if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response &&
      typeof error.response === "object" &&
      "text" in error.response &&
      typeof error.response.text === "function"
    ) {
      const response = error.response as { status?: number; text: () => Promise<string> };
      if (typeof response.status === "number") {
        console.error(`Fetch error response status: ${response.status}`);
      }
      console.error("Fetch error response body:");
      console.error(await response.text());
    } else {
      console.error(error instanceof Error ? error.message : "Unknown error");
    }

    throw error;
  }
};
