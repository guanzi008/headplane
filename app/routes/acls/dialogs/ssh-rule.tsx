import { useState } from "react";

import Input from "~/components/input";
import Link from "~/components/link";
import Select from "~/components/select";
import TokenList from "~/components/token-list";
import { KNOWN_SSH_ACTIONS, type SshRule } from "~/utils/acl-policy";
import { useI18n } from "~/utils/i18n";

import EditorDialog from "./editor-dialog";

interface SshRuleDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  rule?: SshRule;
  sources: string[];
  destinations: string[];
  onSave: (rule: SshRule) => void;
}

const EMPTY: SshRule = { action: "accept", src: [], dst: [], users: [], extra: {} };
const SSH_USERS = ["root", "autogroup:nonroot"];

export default function SshRuleDialog({
  isOpen,
  setIsOpen,
  rule,
  sources,
  destinations,
  onSave,
}: SshRuleDialogProps) {
  const { text: ui } = useI18n();

  const [draft, setDraft] = useState<SshRule>(() => structuredClone(rule ?? EMPTY));

  const isInvalid = draft.src.length === 0 || draft.dst.length === 0 || draft.users.length === 0;

  return (
    <EditorDialog
      description={
        <>
          {ui("SSH rules control Tailscale SSH access between nodes. Read the")}{" "}
          <Link external styled to="https://tailscale.com/kb/1193/tailscale-ssh">
            {ui("Tailscale SSH documentation")}
          </Link>{" "}
          {ui("for details about check mode.")}
        </>
      }
      isDisabled={isInvalid}
      isOpen={isOpen}
      onSubmit={() => onSave(draft)}
      setIsOpen={setIsOpen}
      submitLabel={rule ? ui("Update rule") : ui("Add rule")}
      title={rule ? ui("Edit SSH rule") : ui("New SSH rule")}
    >
      <Select
        items={[
          { value: "accept", label: "Accept — allow the session immediately" },
          { value: "check", label: "Check — require periodic re-authentication" },
          // An action we do not know is listed as-is so it survives an edit.
          ...(KNOWN_SSH_ACTIONS.includes(draft.action)
            ? []
            : [{ value: draft.action, label: `${draft.action} — not known to Headplane` }]),
        ]}
        label={ui("Action")}
        onValueChange={(value) => setDraft({ ...draft, action: value ?? draft.action })}
        value={draft.action}
      />
      <TokenList
        description={ui("Who is allowed to open the SSH session.")}
        emptyText={ui("No sources yet")}
        label={ui("Sources")}
        onChange={(src) => setDraft({ ...draft, src })}
        placeholder="group:ops"
        suggestions={sources}
        values={draft.src}
      />
      <TokenList
        description={ui("The nodes that accept the SSH session.")}
        emptyText={ui("No destinations yet")}
        label={ui("Destinations")}
        onChange={(dst) => setDraft({ ...draft, dst })}
        placeholder="tag:server"
        suggestions={destinations}
        values={draft.dst}
      />
      <TokenList
        description={ui("The local Unix users that may be logged into.")}
        emptyText={ui("No SSH users yet")}
        label={ui("SSH users")}
        onChange={(users) => setDraft({ ...draft, users })}
        placeholder="autogroup:nonroot"
        suggestions={SSH_USERS}
        values={draft.users}
      />
      {draft.action === "check" ? (
        <Input
          description={ui("How long a check-mode session stays valid, for example 12h.")}
          label={ui("Check period")}
          onChange={(checkPeriod) =>
            setDraft({ ...draft, checkPeriod: checkPeriod.length > 0 ? checkPeriod : undefined })
          }
          placeholder="12h"
          value={draft.checkPeriod ?? ""}
        />
      ) : null}
    </EditorDialog>
  );
}
