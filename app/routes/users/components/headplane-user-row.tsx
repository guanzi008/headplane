import Avatar from "~/components/avatar";
import Chip from "~/components/chip";
import { TableCell } from "~/components/table";
import type { Role } from "~/server/web/roles";
import cn from "~/utils/cn";
import { useI18n, type MessageKey } from "~/utils/i18n";
import { formatTimeDelta } from "~/utils/time";

import type { HeadplaneUserData } from "../overview";
import MachinesSeen from "./machines-seen";
import MenuOptions from "./menu";

interface HeadplaneUserRowProps {
  user: HeadplaneUserData;
  headscaleUsers: { id: string; name: string; claimed: boolean }[];
  isSelf?: boolean;
  isOwner?: boolean;
  canEditGroups?: boolean;
  policyGroups?: string[];
  policyHasComments?: boolean;
}

export default function HeadplaneUserRow({
  user,
  headscaleUsers,
  isSelf,
  isOwner,
  canEditGroups,
  policyGroups,
  policyHasComments,
}: HeadplaneUserRowProps) {
  const { t } = useI18n();
  const displayName = user.linkedHeadscaleUser?.displayName || user.name || user.email || user.sub;
  const displayUsername =
    user.linkedHeadscaleUser?.displayName &&
    user.linkedHeadscaleUser.displayName !== user.linkedHeadscaleUser.name
      ? user.linkedHeadscaleUser.name
      : undefined;
  const displayEmail = user.linkedHeadscaleUser?.email ?? user.email;

  return (
    <tr className="group">
      <TableCell>
        <div className="flex items-start gap-3">
          <Avatar name={displayName} src={user.profilePicUrl} />
          <div className="min-w-0">
            <p className="font-medium">{displayName}</p>
            <div className="text-muted flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              {displayUsername && <span>{displayUsername}</span>}
              {displayEmail && <span>{displayEmail}</span>}
              {user.groups.map((group) => (
                <span className="font-mono" key={group}>
                  {group}
                </span>
              ))}
              {!user.headscaleUserId && <Chip text={t("users.notLinked")} variant="warn" />}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className={cn(user.role === "member" && "text-muted")}>
        {t(mapRoleToKey(user.role))}
      </TableCell>
      <TableCell className="text-muted whitespace-nowrap">
        {user.lastLoginAt ? (
          <span suppressHydrationWarning title={new Date(user.lastLoginAt).toLocaleString()}>
            {formatTimeDelta(new Date(user.lastLoginAt))}
          </span>
        ) : (
          t("users.never")
        )}
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <MachinesSeen machines={user.machines} />
      </TableCell>
      <TableCell className="w-12 text-right align-middle">
        <MenuOptions
          canEditGroups={canEditGroups}
          currentLink={user.headscaleUserId ?? undefined}
          headscaleUsers={headscaleUsers}
          isOwner={isOwner}
          isSelf={isSelf}
          policyGroups={policyGroups}
          policyHasComments={policyHasComments}
          user={user}
        />
      </TableCell>
    </tr>
  );
}

function mapRoleToKey(role: Role): MessageKey {
  switch (role) {
    case "owner":
      return "role.owner";
    case "admin":
      return "role.admin";
    case "network_admin":
      return "role.networkAdmin";
    case "it_admin":
      return "role.itAdmin";
    case "auditor":
      return "role.auditor";
    case "viewer":
      return "role.viewer";
    case "member":
      return "role.member";
    default:
      return "role.unknown";
  }
}
