import type { HeadscaleConnectionError } from "./error";

/**
 * Represents an error returned by the Headscale API.
 */
export interface HeadscaleAPIError {
  requestUrl: `${string} ${string}`;
  statusCode: number;
  rawData: string;
  data: Record<string, unknown> | null;
}

/**
 * Type guard to check if an error is a HeadscaleAPIError.
 * @param error - The error to check.
 * @returns True if the error is a HeadscaleAPIError, false otherwise.
 */
export function isApiError(error: unknown): error is HeadscaleAPIError {
  return (
    error != null &&
    typeof error === "object" &&
    "requestUrl" in error &&
    "statusCode" in error &&
    "rawData" in error &&
    "data" in error
  );
}

/**
 * Type guard to check if an error is a HeadscaleConnectionError.
 * @param error - The error to check.
 * @returns True if the error is a HeadscaleConnectionError, false otherwise.
 */
export function isConnectionError(error: unknown): error is HeadscaleConnectionError {
  return (
    error != null &&
    typeof error === "object" &&
    "requestUrl" in error &&
    "errorCode" in error &&
    "errorMessage" in error &&
    "extraData" in error
  );
}

/**
 * Type guard to check if an error is a DataUnauthorizedError.
 * This checks if the error has a `data` property with a `statusCode` of 401.
 *
 * @param error - The error to check.
 * @returns True if the error is a DataUnauthorizedError, false otherwise.
 */
export function isDataUnauthorizedError(error: unknown): boolean {
  return (
    error != null &&
    typeof error === "object" &&
    "data" in error &&
    typeof error.data === "object" &&
    error.data != null &&
    "statusCode" in error.data &&
    error.data.statusCode === 401
  );
}

/**
 * Type guard to check if an error is a DataWithResponseInit wrapping a
 * HeadscaleAPIError. This is used in loaders/actions to handle errors thrown by
 * `data()` before they reach the ErrorBoundary.
 *
 * @param error - The error to check.
 * @returns True if the error is a DataWithResponseInit containing a
 * HeadscaleAPIError, false otherwise.
 */
export function isDataWithApiError(error: unknown): error is { data: HeadscaleAPIError } {
  return error != null && typeof error === "object" && "data" in error && isApiError(error.data);
}

export function headscaleErrorMessage(error: unknown): string | undefined {
  if (error == null || typeof error !== "object" || !("data" in error)) {
    return undefined;
  }

  if (isConnectionError(error.data)) {
    return "Couldn't reach Headscale. Check that it's running and try again.";
  }

  if (!isApiError(error.data)) {
    return undefined;
  }

  const { data, rawData, statusCode } = error.data;
  const message = problemMessage(data) ?? rawData;

  if (message.length === 0) {
    return `Headscale rejected the change (${statusCode}).`;
  }

  return message.charAt(0).toUpperCase() + message.slice(1);
}

// Headscale 0.30 uses RFC 7807 problem+json. The useful cause is in
// `errors[].message`; `detail` usually names the operation. Prefer the
// causes so callers keep the specific messages older versions returned.
// 0.27-0.29 used `message`, which stays first for compatibility.
function problemMessage(data: Record<string, unknown> | null): string | undefined {
  if (data == null) return undefined;

  if (typeof data.message === "string" && data.message.length > 0) {
    return data.message;
  }

  if (Array.isArray(data.errors)) {
    const messages = data.errors
      .map((error) => {
        if (typeof error === "string") return error;
        if (
          error != null &&
          typeof error === "object" &&
          "message" in error &&
          typeof error.message === "string"
        ) {
          return error.message;
        }
        return undefined;
      })
      .filter((message): message is string => typeof message === "string" && message.length > 0);

    if (messages.length > 0) {
      return messages.join(": ");
    }
  }

  if (typeof data.detail === "string" && data.detail.length > 0) {
    return data.detail;
  }

  if (typeof data.title === "string" && data.title.length > 0) {
    return data.title;
  }

  return undefined;
}
