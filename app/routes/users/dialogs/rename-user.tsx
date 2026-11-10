import ActionDialog from "~/components/action-dialog";
import Input from "~/components/input";
import type { User } from "~/types";
import { fieldValidator } from "~/utils/form";
import { useI18n } from "~/utils/i18n";
import { USERNAME_RULE } from "~/utils/user";

import { username } from "../schemas";

interface RenameProps {
  user: User;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const validateUsername = fieldValidator(username);

export default function RenameUser({ user, isOpen, setIsOpen }: RenameProps) {
  const { text: ui } = useI18n();

  return (
    <ActionDialog
      description={ui("ACL policies that refer to the old username aren't updated.")}
      fields={{ headscale_user_id: user.id }}
      intent="rename"
      onOpenChange={setIsOpen}
      open={isOpen}
      submitLabel={ui("Rename")}
      title={ui("Rename {name}", { name: user.name || user.displayName || user.id })}
    >
      <Input
        defaultValue={user.name}
        description={USERNAME_RULE}
        label={ui("Username")}
        name="name"
        required
        validate={validateUsername}
      />
    </ActionDialog>
  );
}
