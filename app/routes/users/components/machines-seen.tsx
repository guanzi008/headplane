import { formatTimeDelta } from "~/utils/time";

interface MachinesSeenProps {
  machines: { online: boolean; lastSeen: string | null }[];
}

export default function MachinesSeen({ machines }: MachinesSeenProps) {
  if (machines.length === 0) {
    return <span className="text-muted">No machines</span>;
  }

  if (machines.some((machine) => machine.online)) {
    return <span className="text-ok">Connected</span>;
  }

  const seen = machines.flatMap((machine) =>
    machine.lastSeen ? [new Date(machine.lastSeen).getTime()] : [],
  );
  if (seen.length === 0) {
    return <span className="text-muted">Never seen</span>;
  }

  const lastSeen = new Date(Math.max(...seen));
  return (
    <span className="text-muted" suppressHydrationWarning title={lastSeen.toLocaleString()}>
      {formatTimeDelta(lastSeen)}
    </span>
  );
}
