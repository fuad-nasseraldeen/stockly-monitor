import { getConfig } from "./config";
import { createHttpClient } from "./http";
import { runApiChecks, runOptionalAuthCheck } from "./checks/apiChecks";
import { buildReport, printSummary } from "./report";
import { postMonitoringReport } from "./sender";

const run = async (): Promise<void> => {
  const config = getConfig();
  const client = createHttpClient(config.stocklyApiUrl);

  const checks = await runApiChecks(client);
  const authCheck = await runOptionalAuthCheck(client, {
    email: config.testAdminEmail,
    password: config.testAdminPassword,
    token: config.testAdminToken
  });

  checks.push(authCheck);

  const report = buildReport(checks);
  printSummary(report);

  try {
    const postResult = await postMonitoringReport(client, config.monitoringIngestSecret, report);
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