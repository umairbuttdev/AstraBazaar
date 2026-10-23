export default function CheckoutLoading() {
  return (
    <main className="container-page flex-1 py-8 md:py-12">
      <div className="animate-pulse">
        <div className="h-4 w-24 rounded bg-surface-secondary" />
        <div className="mt-4 h-10 w-48 rounded bg-surface-secondary" />
        <div className="mt-8 h-80 rounded-lg bg-surface-secondary" />
      </div>
    </main>
  );
}
