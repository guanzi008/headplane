import ActionDialog from "~/components/action-dialog";
import Section, { RemoveButton, Row, RowList } from "~/components/section";
import { useI18n } from "~/utils/i18n";

import AddRestriction from "./dialogs/add-restriction";
import type { RestrictionType } from "./schemas";

const copy = {
  domain: {
    title: "Email domains",
    description: "Only people with an email address at one of these domains can sign in.",
    empty: "Any email domain can sign in.",
  },
  group: {
    title: "Groups",
    description: "Only members of one of these groups in your identity provider can sign in.",
    empty: "Any group can sign in.",
  },
  user: {
    title: "Users",
    description: "Only these users in your identity provider can sign in.",
    empty: "Any user can sign in.",
  },
};

interface Props {
  type: RestrictionType;
  values: string[];
  isDisabled: boolean;
}

export default function RestrictionSection({ type, values, isDisabled }: Props) {
  const { text: ui } = useI18n();

  const { title, description, empty } = copy[type];

  return (
    <Section
      action={isDisabled ? undefined : <AddRestriction type={type} />}
      description={ui(description)}
      title={ui(title)}
    >
      {values.length === 0 ? (
        <p className="text-muted py-2.5 text-sm">{ui(empty)}</p>
      ) : (
        <RowList>
          {values.map((value) => (
            <Row
              action={
                <ActionDialog
                  description={ui(
                    `Only the remaining ${type}s can sign in. If none are left, every ${type} can.`,
                  )}
                  fields={{ type, value }}
                  intent="remove"
                  isDestructive
                  submitLabel={ui("Remove")}
                  title={ui("Remove {name}?", { name: value })}
                  trigger={<RemoveButton disabled={isDisabled} />}
                />
              }
              key={value}
            >
              <span className="font-mono text-xs break-all">{value}</span>
            </Row>
          ))}
        </RowList>
      )}
    </Section>
  );
}
