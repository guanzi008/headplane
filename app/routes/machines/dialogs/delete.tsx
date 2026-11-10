import ActionDialog from "~/components/action-dialog";
import type { Machine } from "~/types";
import { useI18n } from "~/utils/i18n";

interface DeleteProps {
  machine: Machine;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Delete({ machine, isOpen, setIsOpen }: DeleteProps) {
  const { text: ui } = useI18n();

  return (
    <ActionDialog
      description={ui(
        "The machine is removed from your tailnet. To add it back, sign in to your tailnet from the device again.",
      )}
      fields={{ node_id: machine.id }}
      intent="delete"
      isDestructive
      onOpenChange={setIsOpen}
      open={isOpen}
      submitLabel={ui("Remove")}
      title={ui("Remove {name}?", { name: machine.givenName })}
    />
  );
}
