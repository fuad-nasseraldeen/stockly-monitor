import axios from "axios";
import type { MonitoringReport } from "./types";

interface SmsConfig {
  apiKey?: string;
  to?: string;
  senderId?: string;
  dashboardUrl?: string;
}

const listCheckNames = (report: MonitoringReport, status: "WARNING" | "FAILED"): string => {
  const names = report.checks.filter((check) => check.status === status).map((check) => check.name);
  return names.length > 0 ? names.join(", ") : "None";
};

const buildMessage = (report: MonitoringReport, dashboardUrl: string): string => {
  return [
    `Stockly Monitoring: ${report.status}`,
    `Passed: ${report.totals.passed} | Warnings: ${report.totals.warning} | Failed: ${report.totals.failed}`,
    `Warnings: ${listCheckNames(report, "WARNING")}`,
    `Failed: ${listCheckNames(report, "FAILED")}`,
    `Dashboard: ${dashboardUrl}`
  ].join("\n");
};

export const sendMonitoringSms = async (report: MonitoringReport, config: SmsConfig): Promise<void> => {
  if (!config.apiKey || !config.to) {
    console.log("SMS notification skipped: missing SMS_TO_API_KEY or ALERT_PHONE_NUMBER");
    return;
  }

  const senderId = config.senderId ?? "Stockly";
  const dashboardUrl = config.dashboardUrl ?? "https://stockly-il.com/admin/monitoring";
  const message = buildMessage(report, dashboardUrl);

  try {
    const response = await axios.post(
      "https://api.sms.to/sms/send",
      {
        message,
        to: config.to,
        sender_id: senderId,
        bypass_optout: true
      },
      {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json"
        },
        timeout: 20000,
        validateStatus: () => true
      }
    );

    if (response.status < 200 || response.status >= 300) {
      console.error(`SMS notification failed with status ${response.status}`);
      console.error("SMS notification response:");
      console.error(typeof response.data === "string" ? response.data : JSON.stringify(response.data));
      return;
    }

    console.log(`SMS notification sent with status ${response.status}`);
  } catch (error) {
    console.error("SMS notification request failed");
    console.error(error instanceof Error ? error.message : "Unknown error");
  }
};
