import { Link as RouterLink } from "react-router";

import Button from "~/components/button";
import { useI18n } from "~/utils/i18n";

import Shell from "./shell";

export default function Logout() {
  const { t } = useI18n();
  return (
    <Shell description={t("auth.logout.description")} title={t("auth.logout.title")}>
      <Button
        className="w-full"
        nativeButton={false}
        render={<RouterLink prefetch="none" reloadDocument to="/login" />}
        variant="primary"
      >
        {t("error.signInAgain")}
      </Button>
    </Shell>
  );
}
