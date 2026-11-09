import { useI18n } from "~/utils/i18n";
import { formatTimeDelta } from "~/utils/time";

interface MachinesSeenProps {
  machines: { online: boolean; lastSeen: string | null }[];
}

export default function MachinesSeen({ machines }: MachinesSeenProps) {
  const { t } = useI18n();
  if (machines.length === 0) {
    return <span className="text-muted">{t("users.noMachines")}</span>;
  }

  if (machines.some((machine) => machine.online)) {
    return <span className="text-ok">{t("machines.connected")}</span>;
  }

  const seen = machines.flatMap((machine) =>
    machine.lastSeen ? [new Date(machine.lastSeen).getTime()] : [],
  );
  if (seen.length === 0) {
    return <span className="text-muted">{t("users.neverSeen")}</span>;
  }

  const lastSeen = new Date(Math.max(...seen));
  return (
    <span className="text-muted" suppressHydrationWarning title={lastSeen.toLocaleString()}>
      {formatTimeDelta(lastSeen)}
    </span>
  );
}
