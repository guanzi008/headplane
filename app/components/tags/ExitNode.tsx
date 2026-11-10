import { useI18n } from "~/utils/i18n";

import Chip from "../chip";
import Tooltip from "../tooltip";

export interface ExitNodeTagProps {
  isEnabled?: boolean;
}

export function ExitNodeTag({ isEnabled }: ExitNodeTagProps) {
  const { text: ui } = useI18n();

  return (
    <Tooltip
      content={
        isEnabled ? (
          <>{ui("This machine is acting as an exit node.")}</>
        ) : (
          <>
            {ui(
              'This machine is requesting to be used as an exit node. Review it from "Edit route settings" in the machine\'s menu.',
            )}
          </>
        )
      }
    >
      <Chip text="Exit node" variant={isEnabled ? "neutral" : "warn"} />
    </Tooltip>
  );
}
