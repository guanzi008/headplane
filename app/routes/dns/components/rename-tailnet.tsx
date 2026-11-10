import ActionDialog from "~/components/action-dialog";
import Button from "~/components/button";
import Input from "~/components/input";
import { useI18n } from "~/utils/i18n";

interface Props {
  name: string;
  isDisabled: boolean;
}

export default function RenameTailnet({ name, isDisabled }: Props) {
  const { text: ui } = useI18n();

  return (
    <ActionDialog
      description={ui("Devices may misbehave until they pick up the new name.")}
      intent="rename_tailnet"
      submitLabel={ui("Rename")}
      title={ui("Rename tailnet")}
      trigger={
        <Button disabled={isDisabled} size="sm">
          {ui("Rename")}
        </Button>
      }
    >
      <Input
        defaultValue={name}
        label={ui("Tailnet name")}
        name="name"
        placeholder="ts.net"
        required
      />
    </ActionDialog>
  );
}
