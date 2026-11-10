import ActionDialog from "~/components/action-dialog";
import { useI18n } from "~/utils/i18n";

interface TransferOwnershipProps {
  targetHeadplaneUserId: string;
  targetDisplayName: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function TransferOwnership({
  targetHeadplaneUserId,
  targetDisplayName,
  isOpen,
  setIsOpen,
}: TransferOwnershipProps) {
  const { text: ui } = useI18n();

  return (
    <ActionDialog
      description={ui(
        "{name} becomes the owner of this Headplane instance and you become an Admin. Only the new owner can transfer it back.",
        { name: targetDisplayName },
      )}
      fields={{ headplane_user_id: targetHeadplaneUserId }}
      intent="transfer"
      isDestructive
      onOpenChange={setIsOpen}
      open={isOpen}
      submitLabel={ui("Transfer ownership")}
      title={ui("Transfer ownership to {name}?", { name: targetDisplayName })}
    />
  );
}
