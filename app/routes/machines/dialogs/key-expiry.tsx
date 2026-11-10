import ActionDialog from "~/components/action-dialog";
import { KEY_EXPIRY_DAYS } from "~/server/headscale/api/resources/nodes";
import type { Machine } from "~/types";
import { useI18n } from "~/utils/i18n";
import { isNoExpiry } from "~/utils/node-info";

interface KeyExpiryProps {
  machine: Machine;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function KeyExpiry({ machine, isOpen, setIsOpen }: KeyExpiryProps) {
  const { text: ui } = useI18n();
  const isDisabling = !isNoExpiry(machine.expiry);

  return (
    <ActionDialog
      description={
        isDisabling
          ? ui("The machine stays signed in until you expire or remove it.")
          : ui("The machine has to sign in again in {days} days, when its key expires.", {
              days: KEY_EXPIRY_DAYS,
            })
      }
      fields={{ node_id: machine.id, disable_expiry: String(isDisabling) }}
      intent="toggle_expiry"
      onOpenChange={setIsOpen}
      open={isOpen}
      submitLabel={ui(isDisabling ? "Disable key expiry" : "Enable key expiry")}
      title={ui(isDisabling ? "Disable key expiry for {name}?" : "Enable key expiry for {name}?", {
        name: machine.givenName,
      })}
    />
  );
}
