import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-3 lg:mb-7">
      <div className="min-w-0">
        <h1 className="text-[1.7rem] leading-tight font-bold tracking-tight lg:text-[2.1rem]">{title}</h1>
        {description ? <p className="mt-1 max-w-[65ch] text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
