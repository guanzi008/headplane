import { useState } from "react";

import Link from "~/components/link";
import TokenList from "~/components/token-list";
import { hasSinglePortRange, isValidTagName, type Grant } from "~/utils/acl-policy";
import { useI18n } from "~/utils/i18n";

import EditorDialog from "./editor-dialog";

interface GrantDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  grant?: Grant;
  grantIpAllowsOnePortRange: boolean;
  sources: string[];
  destinations: string[];
  onSave: (grant: Grant) => void;
}

const EMPTY: Grant = { src: [], dst: [], ip: ["*"], via: [], extra: {} };
const IP_SUGGESTIONS = ["*", "tcp:22", "tcp:80", "tcp:443", "udp:53", "icmp"];

export default function GrantDialog({
  isOpen,
  setIsOpen,
  grant,
  grantIpAllowsOnePortRange,
  sources,
  destinations,
  onSave,
}: GrantDialogProps) {
  const { text: ui } = useI18n();

  const [draft, setDraft] = useState<Grant>(() => structuredClone(grant ?? EMPTY));

  // A grant that only carries app capabilities has no `ip`.
  const hasPortList =
    grantIpAllowsOnePortRange && draft.ip.some((value) => !hasSinglePortRange(value));
  const isInvalid =
    draft.src.length === 0 ||
    draft.dst.length === 0 ||
    (draft.ip.length === 0 && !("app" in draft.extra)) ||
    hasPortList;

  return (
    <EditorDialog
      description={
        <>
          {ui(
            "Grants allow traffic from a set of sources to a set of destinations. Unlike access rules, ports and protocols are set separately from the destination. App capabilities are kept but can only be edited in the file. See the",
          )}{" "}
          <Link external styled to="https://tailscale.com/kb/1324/grants">
            {ui("Tailscale grants guide")}
          </Link>{" "}
          {ui("for the full syntax.")}
        </>
      }
      isDisabled={isInvalid}
      isOpen={isOpen}
      onSubmit={() => onSave(draft)}
      setIsOpen={setIsOpen}
      submitLabel={grant ? ui("Update grant") : ui("Add grant")}
      title={grant ? ui("Edit grant") : ui("New grant")}
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
        description={ui("Where the traffic is allowed to go, without a port.")}
        emptyText={ui("No destinations yet")}
        label={ui("Destinations")}
        onChange={(dst) => setDraft({ ...draft, dst })}
        placeholder="tag:web"
        suggestions={destinations}
        values={draft.dst}
      />
      <TokenList
        description={
          grantIpAllowsOnePortRange
            ? ui(
                "Ports and protocols, for example tcp:443 or * for everything. Use one port or range per entry, so tcp:80 and tcp:443 instead of tcp:80,443.",
              )
            : ui("Ports and protocols, for example tcp:443 or * for everything.")
        }
        emptyText={ui("No ports yet")}
        label={ui("Ports and protocols")}
        onChange={(ip) => setDraft({ ...draft, ip })}
        placeholder="tcp:443"
        suggestions={IP_SUGGESTIONS}
        validate={grantIpAllowsOnePortRange ? hasSinglePortRange : undefined}
        values={draft.ip}
      />
      <TokenList
        description={ui(
          "Optional. Tags of the subnet routers or exit nodes the traffic must go through. For exit nodes, use autogroup:internet as the destination. Only tags are allowed.",
        )}
        emptyText={ui("Traffic is not routed through a specific node")}
        label={ui("Via")}
        onChange={(via) => setDraft({ ...draft, via })}
        placeholder="tag:router"
        suggestions={sources.filter((source) => source.startsWith("tag:"))}
        validate={isValidTagName}
        values={draft.via}
      />
    </EditorDialog>
  );
}
