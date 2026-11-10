import ActionDialog from "~/components/action-dialog";
import { RemoveButton } from "~/components/section";
import type { PreAuthKey, User } from "~/types";
import { useI18n } from "~/utils/i18n";

interface ExpireAuthKeyProps {
  authKey: PreAuthKey;
  user: User;
}

export default function ExpireAuthKey({ authKey, user }: ExpireAuthKeyProps) {
  const { text: ui } = useI18n();

  return (
    <ActionDialog
      description={ui("The key stops working for new devices right away.")}
      fields={{ key_id: authKey.id, user_id: user.id }}
      intent="expire"
      isDestructive
      submitLabel={ui("Expire key")}
      title={ui("Expire this auth key?")}
      trigger={<RemoveButton>{ui("Expire")}</RemoveButton>}
    />
  );
}
