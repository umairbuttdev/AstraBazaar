export default function AccountLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-48 rounded bg-mist" />
      <div className="mt-6 h-24 rounded-3xl bg-mist" />
      <p className="mt-4 text-sm text-ink-soft">Loading your account...</p>
    </div>
  );
}
