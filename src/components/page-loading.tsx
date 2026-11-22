/** Placeholder shown in place of a page's content while its data loads. */
export function PageLoading() {
  return (
    <div role="status" aria-label="Loading" className="animate-pulse motion-reduce:animate-none">
      <div className="h-9 w-56 rounded bg-muted" />
      <div className="mt-3 h-5 w-80 max-w-full rounded bg-muted" />
      <div className="mt-8 h-64 rounded-lg bg-muted" />
    </div>
  );
}
