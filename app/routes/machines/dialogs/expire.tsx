import ActionDialog from "~/components/action-dialog";
import type { Machine } from "~/types";
import { useI18n } from "~/utils/i18n";

interface ExpireProps {
  machine: Machine;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Expire({ machine, isOpen, setIsOpen }: ExpireProps) {
  const { text: ui } = useI18n();

  return (
    <ActionDialog
      description={ui(
        "The machine disconnects from your tailnet until someone signs in on it again.",
      )}
      fields={{ node_id: machine.id }}
      intent="expire"
      isDestructive
      onOpenChange={setIsOpen}
      open={isOpen}
      submitLabel={ui("Expire")}
      title={ui("Expire {name}?", { name: machine.givenName })}
    />
  );
}
