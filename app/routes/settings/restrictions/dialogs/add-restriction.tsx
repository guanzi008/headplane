import { Plus } from "lucide-react";
import { useState } from "react";

import ActionDialog from "~/components/action-dialog";
import Button from "~/components/button";
import Input from "~/components/input";
import { fieldValidator } from "~/utils/form";
import { useI18n } from "~/utils/i18n";

import { type RestrictionType, restrictionValue } from "../schemas";

const copy = {
  domain: {
    title: "Add domain",
    label: "Domain",
    description: "Only users with an email address at this domain can sign in through OIDC.",
    placeholder: "example.com",
  },
  group: {
    title: "Add group",
    label: "Group",
    description: "Only members of this OIDC group can sign in.",
    placeholder: "admin",
  },
  user: {
    title: "Add user",
    label: "User",
    description: "Only this OIDC user can sign in.",
    placeholder: "john_doe",
  },
};

const validators = {
  domain: fieldValidator(restrictionValue.domain),
  group: fieldValidator(restrictionValue.group),
  user: fieldValidator(restrictionValue.user),
};

interface AddRestrictionProps {
  type: RestrictionType;
}

export default function AddRestriction({ type }: AddRestrictionProps) {
  const { text: ui } = useI18n();
  const [value, setValue] = useState("");
  const { title, label, description, placeholder } = copy[type];
  const domain = value.trim();

  return (
    <ActionDialog
      description={ui(description)}
      fields={{ type }}
      intent="add"
      submitLabel={ui(title)}
      title={ui(title)}
      trigger={
        <Button>
          <Plus className="size-3.5" />
          {ui(title)}
        </Button>
      }
    >
      <Input
        description={
          type === "domain" && domain.length > 0
            ? ui("Matches <user>@{domain}", { domain })
            : undefined
        }
        label={ui(label)}
        name="value"
        onChange={setValue}
        placeholder={placeholder}
        required
        validate={validators[type]}
      />
    </ActionDialog>
  );
}
