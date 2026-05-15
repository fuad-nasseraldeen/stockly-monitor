import type { AxiosInstance } from "axios";
import type { MonitoringReport } from "./types";

export const postMonitoringReport = async (
  client: AxiosInstance,
  monitoringIngestSecret: string,
  monitoringReportPath: string,
  report: MonitoringReport
): Promise<{ ok: boolean; status: number; body: unknown; url: string; method: "POST" }> => {
  const normalizedPath = `/${monitoringReportPath.replace(/^\/+/, "")}`;
  const baseURL = (client.defaults.baseURL ?? "").replace(/\/+$/, "");
  const url = `${baseURL}${normalizedPath}`;

  console.log(`Report ingestion URL: ${url}`);

  const response = await client.post(normalizedPath, report, {
    headers: {
      "x-monitoring-secret": monitoringIngestSecret
    }
  });

  return {
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
    body: response.data,
    url,
    method: "POST"
  };
};
