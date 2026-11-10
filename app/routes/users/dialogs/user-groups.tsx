import { useState } from "react";

import ActionDialog from "~/components/action-dialog";
import Callout from "~/components/callout";
import Code from "~/components/code";
import Link from "~/components/link";
import TokenList from "~/components/token-list";
import { isValidGroupName } from "~/utils/acl-policy";
import { useI18n } from "~/utils/i18n";

interface UserGroupsProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  // The Headscale username, which is what the ACL policy references.
  userName: string;
  displayName: string;
  groups: string[];
  availableGroups: string[];
  // Whether the stored policy contains HuJSON comments, which saving drops.
  policyHasComments?: boolean;
}

export default function UserGroups({
  isOpen,
  setIsOpen,
  userName,
  displayName,
  groups,
  availableGroups,
  policyHasComments,
}: UserGroupsProps) {
  const { text: ui } = useI18n();

  const [selected, setSelected] = useState([...groups]);
  const isUnchanged =
    selected.length === groups.length && selected.every((group) => groups.includes(group));

  return (
    <ActionDialog
      description={
        <>
          {ui("Groups live in the ACL policy, so saving rewrites its")} <Code>groups</Code>{" "}
          {ui("section.")}{" "}
          <Link external styled to="https://tailscale.com/kb/1018/acls">
            {ui("Docs")}
          </Link>
        </>
      }
      fields={{ user_name: userName }}
      intent="update_groups"
      isDisabled={isUnchanged}
      onOpenChange={setIsOpen}
      open={isOpen}
      submitLabel={ui("Save groups")}
      title={ui("Groups for {name}", { name: displayName })}
    >
      {selected.map((group) => (
        <input key={group} name="groups" type="hidden" value={group} />
      ))}
      <TokenList
        emptyText={ui("This user isn't in any group")}
        label={ui("Groups")}
        onChange={setSelected}
        placeholder="group:example"
        suggestions={availableGroups}
        validate={isValidGroupName}
        values={selected}
      />
      {policyHasComments && (
        <Callout variant="warning">
          {ui("Your policy has comments. Saving here rewrites the policy and drops them.")}
        </Callout>
      )}
    </ActionDialog>
  );
}
