import { useState } from "react";

import Input from "~/components/input";
import Link from "~/components/link";
import TokenList from "~/components/token-list";
import { withDefaultPort, type AclRule } from "~/utils/acl-policy";
import { useI18n } from "~/utils/i18n";

import EditorDialog from "./editor-dialog";

interface AclRuleDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  rule?: AclRule;
  sources: string[];
  destinations: string[];
  onSave: (rule: AclRule) => void;
}

const EMPTY: AclRule = { action: "accept", src: [], dst: [], extra: {} };

export default function AclRuleDialog({
  isOpen,
  setIsOpen,
  rule,
  sources,
  destinations,
  onSave,
}: AclRuleDialogProps) {
  const { text: ui } = useI18n();

  const [draft, setDraft] = useState<AclRule>(() => structuredClone(rule ?? EMPTY));

  const isInvalid = draft.src.length === 0 || draft.dst.length === 0;

  return (
    <EditorDialog
      description={
        <>
          {ui(
            "Access rules allow traffic from a set of sources to a set of destinations. Destinations must include a port, for example",
          )}{" "}
          <code className="font-mono">tag:web:80,443</code>
          {ui(". If you leave the port out,")} <code className="font-mono">:*</code>{" "}
          {ui("is added for you. See the")}{" "}
          <Link external styled to="https://tailscale.com/kb/1018/acls">
            {ui("Tailscale ACL guide")}
          </Link>{" "}
          {ui("for the full syntax.")}
        </>
      }
      isDisabled={isInvalid}
      isOpen={isOpen}
      onSubmit={() => {
        // A hand-written policy may be missing the port spec Headscale wants.
        onSave({ ...draft, dst: draft.dst.map(withDefaultPort) });
      }}
      setIsOpen={setIsOpen}
      submitLabel={rule ? ui("Update rule") : ui("Add rule")}
      title={rule ? ui("Edit access rule") : ui("New access rule")}
    >
      <TokenList
        description={ui(
          "Groups, tags, hosts, users or autogroups allowed to initiate the connection.",
        )}
        emptyText={ui("No sources yet")}
        label={ui("Sources")}
        onChange={(src) => setDraft({ ...draft, src })}
        placeholder="group:eng"
        suggestions={sources}
        values={draft.src}
      />
      <TokenList
        description={ui(
          "Where the traffic is allowed to go. A destination without a port becomes :* (all ports).",
        )}
        emptyText={ui("No destinations yet")}
        label={ui("Destinations")}
        normalize={withDefaultPort}
        onChange={(dst) => setDraft({ ...draft, dst })}
        placeholder="tag:web:80,443"
        suggestions={destinations}
        values={draft.dst}
      />
      <Input
        description={ui("Optional. Restricts the rule to a single protocol (tcp, udp, icmp, ...).")}
        label={ui("Protocol")}
        onChange={(proto) => setDraft({ ...draft, proto: proto.length > 0 ? proto : undefined })}
        placeholder="tcp"
        value={draft.proto ?? ""}
      />
    </EditorDialog>
  );
}
