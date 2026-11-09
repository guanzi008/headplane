import Callout from "~/components/callout";
import { useI18n, type MessageKey } from "~/utils/i18n";

export function OidcErrorNotice({ code }: { code: string }) {
  const { t } = useI18n();
  return (
    <Callout className="mb-6" title={t("auth.oidc.failed.title")} variant="error">
      <p>{t(getErrorMessageKey(code))}</p>
    </Callout>
  );
}

function getErrorMessageKey(code: string): MessageKey {
  switch (code) {
    case "error_no_query":
      return "auth.oidc.noQuery";

    case "error_no_session":
    case "error_invalid_session":
      return "auth.oidc.noSession";

    case "error_no_sub":
      return "auth.oidc.noSub";

    case "error_auth_failed":
      return "auth.oidc.authFailed";

    default:
      return "auth.oidc.unknown";
  }
}
