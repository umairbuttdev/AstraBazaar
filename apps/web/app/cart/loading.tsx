export default function CartLoading() {
  return (
    <main className="container-page flex-1 py-8 md:py-12">
      <div className="animate-pulse">
        <div className="h-4 w-16 rounded bg-surface-secondary" />
        <div className="mt-4 h-10 w-48 rounded bg-surface-secondary" />
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="h-28 rounded-md bg-surface-secondary" />
          <div className="h-48 rounded-lg bg-surface-secondary" />
        </div>
      </div>
    </main>
  );
}
