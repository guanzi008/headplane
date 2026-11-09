import { X } from "lucide-react";
import type { JSX } from "react";

import Button from "~/components/button";
import FilterDropdown from "~/components/filter-dropdown";
import type { User } from "~/types/User";
import { useI18n } from "~/utils/i18n";
import type { PopulatedNode } from "~/utils/node-info";
import { getUserDisplayName, sortUsersByDisplayName } from "~/utils/user";

import { useMachineFilterParams } from "../hooks/use-machine-filter-params";

interface MachineFiltersProps {
  users: User[];
  populatedNodes: PopulatedNode[];
}

export function MachineFilters({ users, populatedNodes }: MachineFiltersProps): JSX.Element {
  const { t } = useI18n();
  const {
    filterUser,
    filterTag,
    filterStatus,
    filterRoute,
    hasActiveFilters,
    setParam,
    clearFilters,
  } = useMachineFilterParams();

  const tagOwnedExists = populatedNodes.some((n) => !n.user);
  const statusOptions = [
    { value: "online", label: t("machines.online") },
    { value: "offline", label: t("machines.offline") },
    { value: "expired", label: t("machines.expired") },
  ] as const;
  const routeOptions = [
    { value: "exit-node", label: t("machines.exitNode") },
    { value: "subnet", label: t("machines.subnetRouter") },
  ] as const;
  const userOptions = [
    ...(tagOwnedExists ? [{ value: "tag-owned", label: t("machines.tagOwned") }] : []),
    ...sortUsersByDisplayName(users).map((u) => ({ value: u.name, label: getUserDisplayName(u) })),
  ];

  const tagOptions = Array.from(new Set(populatedNodes.flatMap((n) => n.tags)))
    .filter(Boolean)
    .sort()
    .map((tag) => ({ value: tag, label: tag }));

  return (
    <>
      {userOptions.length > 0 && (
        <FilterDropdown
          label={t("machines.filterUser")}
          onChange={(v) => setParam("user", v)}
          options={userOptions}
          value={filterUser}
        />
      )}
      {tagOptions.length > 0 && (
        <FilterDropdown
          label={t("machines.filterTag")}
          onChange={(v) => setParam("tag", v)}
          options={tagOptions}
          value={filterTag}
        />
      )}
      <FilterDropdown
        label={t("machines.filterStatus")}
        onChange={(v) => setParam("status", v)}
        options={statusOptions}
        value={filterStatus}
      />
      <FilterDropdown
        label={t("machines.filterRoute")}
        onChange={(v) => setParam("route", v)}
        options={routeOptions}
        value={filterRoute}
      />
      {hasActiveFilters && (
        <Button onClick={clearFilters} variant="ghost">
          {t("machines.clearFilters")}
          <X className="size-3.5" />
        </Button>
      )}
    </>
  );
}
