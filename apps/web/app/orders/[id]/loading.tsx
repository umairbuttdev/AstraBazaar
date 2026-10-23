export default function OrderDetailLoading() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10 md:px-10">
      <div className="animate-pulse">
        <div className="h-4 w-24 rounded bg-mist" />
        <div className="mt-4 h-10 w-64 rounded bg-mist" />
        <div className="mt-8 h-48 rounded-3xl bg-mist" />
      </div>
      <p className="mt-4 text-sm text-ink-soft">Loading order details...</p>
    </main>
  );
}
