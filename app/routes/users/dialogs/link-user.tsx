import ActionDialog from "~/components/action-dialog";
import Callout from "~/components/callout";
import Select from "~/components/select";
import { useI18n } from "~/utils/i18n";

interface LinkUserProps {
  headplaneUserId: string;
  displayName: string;
  headscaleUsers: { id: string; name: string }[];
  currentLink?: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function LinkUser({
  headplaneUserId,
  displayName,
  headscaleUsers,
  currentLink,
  isOpen,
  setIsOpen,
}: LinkUserProps) {
  const { text: ui } = useI18n();

  const hasChoices = headscaleUsers.length > 0;

  return (
    <ActionDialog
      description={ui(
        "The linked Headscale user decides which machines they can manage and enables self-service features.",
      )}
      fields={{ headplane_user_id: headplaneUserId }}
      intent="link"
      isDisabled={!hasChoices}
      onOpenChange={setIsOpen}
      open={isOpen}
      submitLabel={ui("Link user")}
      title={ui("Link a Headscale user to {name}", { name: displayName })}
    >
      {hasChoices ? (
        <Select
          defaultValue={currentLink ?? null}
          items={headscaleUsers.map((user) => ({
            value: user.id,
            label:
              user.id === currentLink ? ui("{name} (current)", { name: user.name }) : user.name,
          }))}
          label={ui("Headscale user")}
          name="headscale_user_id"
          placeholder={ui("Select a Headscale user")}
          required
        />
      ) : (
        <Callout>{ui("Every Headscale user is already linked to another account.")}</Callout>
      )}
    </ActionDialog>
  );
}
