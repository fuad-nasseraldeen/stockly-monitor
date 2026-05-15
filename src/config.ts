interface EnvConfig {
  stocklyApiUrl: string;
  monitoringIngestSecret: string;
  monitoringReportPath: string;
  testAdminEmail?: string;
  testAdminPassword?: string;
  testAdminToken?: string;
}

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value.trim();
};

const optionalEnv = (name: string): string | undefined => {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    return undefined;
  }

  return value.trim();
};

export const getConfig = (): EnvConfig => {
  const stocklyApiUrl = requireEnv("STOCKLY_API_URL").replace(/\/+$/, "");
  const monitoringIngestSecret = requireEnv("MONITORING_INGEST_SECRET");
  const monitoringReportPath = optionalEnv("MONITORING_REPORT_PATH") ?? "/admin/monitoring/report";

  return {
    stocklyApiUrl,
    monitoringIngestSecret,
    monitoringReportPath,
    testAdminEmail: optionalEnv("STOCKLY_TEST_ADMIN_EMAIL"),
    testAdminPassword: optionalEnv("STOCKLY_TEST_ADMIN_PASSWORD"),
    testAdminToken: optionalEnv("STOCKLY_TEST_ADMIN_TOKEN")
  };
};
