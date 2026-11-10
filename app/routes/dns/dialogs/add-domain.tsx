import { Plus } from "lucide-react";

import ActionDialog from "~/components/action-dialog";
import Button from "~/components/button";
import Input from "~/components/input";
import { useI18n } from "~/utils/i18n";

export default function AddDomain() {
  const { text: ui } = useI18n();

  return (
    <ActionDialog
      description={ui("Devices try this suffix when resolving a short name.")}
      intent="add_domain"
      submitLabel={ui("Add domain")}
      title={ui("Add search domain")}
      trigger={
        <Button>
          <Plus className="size-3.5" />
          {ui("Add domain")}
        </Button>
      }
    >
      <Input label={ui("Domain")} name="domain" placeholder="corp.example.com" required />
    </ActionDialog>
  );
}
