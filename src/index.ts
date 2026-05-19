import "dotenv/config";
import { getConfig } from "./config";
import { createHttpClient } from "./http";
import { runApiChecks, runOptionalAuthCheck } from "./checks/apiChecks";
import { buildReport, printSummary } from "./report";
import { postMonitoringReport } from "./sender";

const run = async (): Promise<void> => {
  const config = getConfig();
  const client = createHttpClient(config.stocklyApiUrl);

  const authInput = {
    email: config.testAdminEmail,
    password: config.testAdminPassword,
    token: config.testAdminToken
  };

  const checks = await runApiChecks(client, config.monitoringIngestSecret);
  const authCheck = await runOptionalAuthCheck(client, authInput);

  checks.push(authCheck);

  const report = buildReport(checks);
  printSummary(report);

  try {
    const postResult = await postMonitoringReport(
      client,
      config.monitoringIngestSecret,
      config.monitoringReportPath,
      report
    );
    if (!postResult.ok) {
      console.error(`Report ingestion failed with status ${postResult.status}`);
      process.exitCode = 1;
      return;
    }

    console.log(`Report ingestion succeeded with status ${postResult.status}`);
  } catch (error) {
    console.error("Report ingestion request failed");
    console.error(error instanceof Error ? error.message : "Unknown error");
    process.exitCode = 1;
  }
};

run().catch((error) => {
  console.error("Monitoring run crashed");
  console.error(error instanceof Error ? error.message : "Unknown error");
  process.exit(1);
});
