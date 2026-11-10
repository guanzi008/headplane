import { Loader2 } from "lucide-react";

import cn from "~/utils/cn";
import { useI18n } from "~/utils/i18n";

export default function Fallback() {
  const { text: ui } = useI18n();

  return (
    <div
      className={cn("h-editor overflow-hidden rounded-md", "bg-[var(--cm-bg)] text-[var(--cm-fg)]")}
    >
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-[var(--cm-gutter-fg)]">
          <Loader2 className="size-5 animate-spin" />
          <p className="text-sm">{ui("Loading editor…")}</p>
        </div>
      </div>
    </div>
  );
}
