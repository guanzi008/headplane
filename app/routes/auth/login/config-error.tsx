import Callout from "~/components/callout";
import Link from "~/components/link";
import type { OidcErrorCode } from "~/server/oidc/provider";
import { useI18n, type MessageKey } from "~/utils/i18n";

export function OidcDiscoveryFailedNotice() {
  const { t } = useI18n();
  return (
    <Callout className="mb-6" title={t("auth.oidc.unavailable.title")} variant="warning">
      {t("auth.oidc.unavailable.body")}
    </Callout>
  );
}

export function OidcConfigErrorNotice({ errors }: { errors: OidcErrorCode[] }) {
  const { t } = useI18n();
  return (
    <Callout className="mb-6" title={t("auth.oidc.misconfigured.title")} variant="error">
      <ul className="list-inside list-disc">
        {mapOidcErrorsToMessages(errors, t).map((code) => (
          <li key={code.key}>{code.node}</li>
        ))}
      </ul>
      <Link external styled to="https://headplane.net/features/sso#troubleshooting">
        {t("auth.oidc.troubleshooting")}
      </Link>
    </Callout>
  );
}

function mapOidcErrorsToMessages(errors: OidcErrorCode[], t: (key: MessageKey) => string) {
  const messages: {
    key: string;
    node: React.ReactNode;
  }[] = [];

  for (const error of errors) {
    switch (error) {
      case "invalid_api_key": {
        messages.push({
          key: error,
          node: <span>{t("auth.oidc.invalidApiKey")}</span>,
        });
        break;
      }

      case "missing_endpoints": {
        messages.push({
          key: error,
          node: <span>{t("auth.oidc.missingEndpoints")}</span>,
        });
        break;
      }

      case "discovery_failed": {
        messages.push({
          key: error,
          node: <span>{t("auth.oidc.discoveryFailed")}</span>,
        });
        break;
      }

      default: {
        messages.push({
          key: error,
          node: <span>{t("auth.oidc.unknownConfig")}</span>,
        });
        break;
      }
    }
  }

  return messages;
}
