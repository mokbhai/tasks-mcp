import type { AppConfig } from "../config";

const buildExpectedHeader = (user: string, password: string): string =>
  `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`;

const readAuthorization = (metadata: unknown): string | undefined => {
  if (!metadata || typeof metadata !== "object") {
    return undefined;
  }

  const record = metadata as Record<string, unknown>;
  const direct = record.authorization ?? record.Authorization;
  if (typeof direct === "string") {
    return direct;
  }

  const headers = record.headers;
  if (headers && typeof headers === "object") {
    const headerRecord = headers as Record<string, unknown>;
    const headerAuth =
      headerRecord.authorization ?? headerRecord.Authorization;
    if (typeof headerAuth === "string") {
      return headerAuth;
    }
  }

  return undefined;
};

export const ensureAuthorized = (
  config: AppConfig,
  metadata?: Record<string, unknown>
) => {
  const { authUser, authPassword } = config;

  if (!authUser || !authPassword) {
    return;
  }

  const expectedHeader = buildExpectedHeader(authUser, authPassword);
  const providedHeader = readAuthorization(metadata);

  if (!providedHeader) {
    throw new Error("Missing basic authentication credentials.");
  }

  if (providedHeader !== expectedHeader) {
    throw new Error("Invalid basic authentication credentials.");
  }
};
