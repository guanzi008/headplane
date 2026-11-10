import { useState } from "react";

import ActionDialog from "~/components/action-dialog";
import Code from "~/components/code";
import Input from "~/components/input";
import type { Machine } from "~/types";
import { fieldValidator } from "~/utils/form";
import { useI18n } from "~/utils/i18n";

import { machineName } from "../schemas";

interface RenameProps {
  machine: Machine;
  isOpen: boolean;
  magic?: string;
  setIsOpen: (isOpen: boolean) => void;
}

const validateName = fieldValidator(machineName);

export default function Rename({ machine, magic, isOpen, setIsOpen }: RenameProps) {
  const { text: ui } = useI18n();

  const [name, setName] = useState(machine.givenName);
  const isValid = validateName(name) === null;

  return (
    <ActionDialog
      description={ui(
        "This name is shown in the admin panel, in Tailscale clients, and used when generating MagicDNS names.",
      )}
      fields={{ node_id: machine.id }}
      intent="rename"
      isDisabled={name === machine.givenName}
      onOpenChange={setIsOpen}
      open={isOpen}
      submitLabel={ui("Rename")}
      title={ui("Rename {name}", { name: machine.givenName })}
    >
      <Input
        defaultValue={machine.givenName}
        label={ui("Machine name")}
        name="name"
        onChange={setName}
        required
        validate={validateName}
      />
      {magic && isValid && (
        <p className="text-muted">
          {name === machine.givenName ? (
            <>
              {ui("Reachable at")} <Code>{machine.givenName}</Code>
              {ui(".")}
            </>
          ) : (
            <>
              {ui("Will be reachable at")} <Code>{name.toLowerCase()}</Code>
              {ui(", and")} <Code>{machine.givenName}</Code> {ui("will stop resolving.")}
            </>
          )}
        </p>
      )}
    </ActionDialog>
  );
}
