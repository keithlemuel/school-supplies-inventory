import type { ReactNode } from "react";

/** What a list shows when there is nothing in it yet, with the next thing to do. */
export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-input bg-card/60 px-6 py-10 text-center">
      <p className="font-heading text-lg font-bold">{title}</p>
      {children ? <p className="mx-auto mt-1 max-w-[50ch] text-muted-foreground">{children}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
