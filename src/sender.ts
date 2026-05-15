import type { AxiosInstance } from "axios";
import type { MonitoringReport } from "./types";

export const postMonitoringReport = async (
  client: AxiosInstance,
  monitoringIngestSecret: string,
  report: MonitoringReport
): Promise<{ ok: boolean; status: number }> => {
  const response = await client.post("/admin/monitoring/report", report, {
    headers: {
      "x-monitoring-secret": monitoringIngestSecret
    }
  });

  return {
    ok: response.status >= 200 && response.status < 300,
    status: response.status
  };
};