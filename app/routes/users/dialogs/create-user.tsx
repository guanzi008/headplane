import { Plus } from "lucide-react";

import ActionDialog from "~/components/action-dialog";
import Button from "~/components/button";
import Input from "~/components/input";
import { fieldValidator } from "~/utils/form";
import { useI18n } from "~/utils/i18n";
import { USERNAME_RULE } from "~/utils/user";

import { username } from "../schemas";

interface CreateUserProps {
  isOidc?: boolean;
  isDisabled?: boolean;
}

const validateUsername = fieldValidator(username);

export default function CreateUser({ isOidc, isDisabled }: CreateUserProps) {
  const { text: ui } = useI18n();

  return (
    <ActionDialog
      description={ui(
        isOidc
          ? "The user is listed under Unlinked Headscale Users until they sign in through your OIDC provider, which links them to a Headplane account."
          : "The user is listed under Unlinked Headscale Users until they sign in, which links them to a Headplane account.",
      )}
      intent="create"
      submitLabel={ui("Create user")}
      title={ui("Create a Headscale user")}
      trigger={
        <Button disabled={isDisabled} variant="primary">
          <Plus className="size-3.5" />
          {ui("Add user")}
        </Button>
      }
    >
      <Input
        description={USERNAME_RULE}
        label={ui("Username")}
        name="name"
        placeholder="my-new-user"
        required
        validate={validateUsername}
      />
      <Input label={ui("Display name")} name="display_name" placeholder="John Doe" />
      <Input label={ui("Email")} name="email" placeholder="name@example.com" type="email" />
    </ActionDialog>
  );
}
