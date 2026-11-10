import { Computer, FileKey2, Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

import ActionDialog from "~/components/action-dialog";
import CodeBlock from "~/components/code-block";
import Input from "~/components/input";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "~/components/menu";
import Select from "~/components/select";
import type { User } from "~/types";
import { useI18n } from "~/utils/i18n";
import { normalizeRegistrationKey } from "~/utils/register-key";
import { getUserDisplayName, sortUsersByDisplayName } from "~/utils/user";

export interface NewMachineProps {
  server: string;
  users: User[];
  isDisabled?: boolean;
  disabledKeys?: string[];
}

export default function NewMachine(data: NewMachineProps) {
  const { text: ui } = useI18n();

  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <ActionDialog
        description={ui("Run this on the device, then paste the key it prints.")}
        intent="register"
        onOpenChange={setIsRegisterOpen}
        open={isRegisterOpen}
        submitLabel={ui("Register")}
        title={ui("Register a machine")}
      >
        <CodeBlock>{`tailscale up --login-server=${data.server}`}</CodeBlock>
        <Input
          description={ui("The registration URL or the full hskey-authreq-... key.")}
          label={ui("Machine key")}
          name="register_key"
          placeholder="hskey-authreq-XXXXXXXXXXXXXXXXXXXXXXXX"
          required
          validate={(value) =>
            normalizeRegistrationKey(String(value ?? ""))
              ? null
              : "Paste the registration URL or full hskey-authreq-... key."
          }
        />
        <Select
          items={sortUsersByDisplayName(data.users).map((user) => ({
            // Headscale's v1/node/register endpoint resolves the owner by
            // username via GetUserByName, so we must pass user.name (not id).
            value: user.name,
            label: getUserDisplayName(user),
          }))}
          label={ui("Owner")}
          name="user"
          placeholder={ui("Select a user")}
          required
        />
      </ActionDialog>
      <Menu disabled={data.isDisabled}>
        <MenuTrigger className="bg-ink text-ink-fg hover:bg-ink/90 h-8 gap-1.5 rounded-md px-3 text-sm font-medium">
          <Plus className="size-3.5" />
          {ui("Add machine")}
        </MenuTrigger>
        <MenuContent>
          <MenuItem
            disabled={data.disabledKeys?.includes("register")}
            onClick={() => setIsRegisterOpen(true)}
          >
            <div className="flex items-center gap-x-3">
              <Computer className="w-4" />
              {ui("Register machine key")}
            </div>
          </MenuItem>
          <MenuItem
            disabled={data.disabledKeys?.includes("pre-auth")}
            onClick={() => navigate("/settings/auth-keys")}
          >
            <div className="flex items-center gap-x-3">
              <FileKey2 className="w-4" />
              {ui("Create auth key")}
            </div>
          </MenuItem>
        </MenuContent>
      </Menu>
    </>
  );
}
