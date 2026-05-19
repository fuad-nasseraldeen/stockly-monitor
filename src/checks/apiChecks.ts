import type { AxiosInstance } from "axios";
import type { CheckResult, CheckStatus, CheckType } from "../types";

const PRODUCTS_PATH = "/admin/monitoring/health/products";
const SUPPLIERS_PATH = "/admin/monitoring/health/suppliers";
const CATEGORIES_PATH = "/admin/monitoring/health/categories";

const WARNING_STATUS_CODES = new Set([401, 403, 404]);

const toStatus = (statusCode: number): CheckStatus => {
  if (statusCode >= 200 && statusCode < 300) {
    return "PASSED";
  }

  if (WARNING_STATUS_CODES.has(statusCode)) {
    return "WARNING";
  }

  return "FAILED";
};

const timedRequest = async (
  name: string,
  type: CheckType,
  request: () => Promise<{ status: number; data: unknown }>
): Promise<CheckResult> => {
  const startedAt = Date.now();

  try {
    const response = await request();
    const responseTimeMs = Date.now() - startedAt;
    const status = toStatus(response.status);

    return {
      name,
      type,
      status,
      responseTimeMs,
      message: `HTTP ${response.status}`,
      details: {
        statusCode: response.status,
        itemCount: safeCountFromBody(response.data)
      }
    };
  } catch (error) {
    const responseTimeMs = Date.now() - startedAt;

    return {
      name,
      type,
      status: "FAILED",
      responseTimeMs,
      message: "Request error",
      details: {
        error: error instanceof Error ? error.message : "Unknown error"
      }
    };
  }
};

const safeCountFromBody = (body: unknown): number | undefined => {
  if (Array.isArray(body)) {
    return body.length;
  }

  if (body && typeof body === "object") {
    const candidateArrays = Object.values(body as Record<string, unknown>).filter(Array.isArray);
    if (candidateArrays.length > 0) {
      return candidateArrays[0].length;
    }
  }

  return undefined;
};

interface AuthInput {
  email?: string;
  password?: string;
  token?: string;
}

const monitoringHeader = (monitoringIngestSecret: string): Record<string, string> => {
  return { "x-monitoring-secret": monitoringIngestSecret };
};

const baseUrlFromClient = (client: AxiosInstance): string => {
  return (client.defaults.baseURL ?? "").replace(/\/+$/, "");
};

const checkWithUrlLog = async (
  client: AxiosInstance,
  name: string,
  type: CheckType,
  path: string,
  headers?: Record<string, string>
): Promise<CheckResult> => {
  console.log(`Checking ${name}: ${baseUrlFromClient(client)}${path}`);
  return timedRequest(name, type, async () => {
    const response = await client.get(path, headers ? { headers } : undefined);
    return { status: response.status, data: response.data };
  });
};

export const runApiChecks = async (
  client: AxiosInstance,
  monitoringIngestSecret: string
): Promise<CheckResult[]> => {
  return Promise.all([
    checkWithUrlLog(
      client,
      "products-list",
      "DATA",
      PRODUCTS_PATH,
      monitoringHeader(monitoringIngestSecret)
    ),
    checkWithUrlLog(
      client,
      "suppliers-list",
      "DATA",
      SUPPLIERS_PATH,
      monitoringHeader(monitoringIngestSecret)
    ),
    checkWithUrlLog(
      client,
      "categories-list",
      "DATA",
      CATEGORIES_PATH,
      monitoringHeader(monitoringIngestSecret)
    ),
    checkWithUrlLog(client, "dashboard-health", "API", "/health")
  ]);
};

export const runOptionalAuthCheck = async (
  client: AxiosInstance,
  authInput: AuthInput
): Promise<CheckResult> => {
  const hasCredentials = Boolean(authInput.token || (authInput.email && authInput.password));
  if (!hasCredentials) {
    return {
      name: "auth-check",
      type: "AUTH",
      status: "WARNING",
      responseTimeMs: 0,
      message: "Skipped: no safe test credentials provided",
      details: {
        skipped: true
      }
    };
  }

  return timedRequest("auth-check", "AUTH", async () => {
    if (authInput.token) {
      const response = await client.get("/admin/me", {
        headers: {
          Authorization: `Bearer ${authInput.token}`
        }
      });

      return { status: response.status, data: response.data };
    }

    const response = await client.post("/admin/login", {
      email: authInput.email,
      password: authInput.password
    });

    return { status: response.status, data: response.data };
  });
};
