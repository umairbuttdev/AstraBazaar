export default function OrdersLoading() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10 md:px-10">
      <div className="animate-pulse">
        <div className="h-4 w-20 rounded bg-mist" />
        <div className="mt-4 h-10 w-48 rounded bg-mist" />
        <div className="mt-8 h-40 rounded-3xl bg-mist" />
      </div>
      <p className="mt-4 text-sm text-ink-soft">Loading orders...</p>
    </main>
  );
}
