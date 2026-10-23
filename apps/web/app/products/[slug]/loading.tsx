import { Container } from "@/components/ui/container";

export default function ProductLoading() {
  return (
    <main className="flex-1 pb-28 pt-4 md:pb-20 md:pt-6">
      <Container>
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="aspect-[4/5] animate-pulse rounded-lg bg-surface-secondary" />
          <div className="space-y-4">
            <div className="h-4 w-24 animate-pulse rounded bg-surface-secondary" />
            <div className="h-10 w-2/3 animate-pulse rounded bg-surface-secondary" />
            <div className="h-6 w-32 animate-pulse rounded bg-surface-secondary" />
            <div className="h-12 w-full animate-pulse rounded bg-surface-secondary" />
          </div>
        </div>
      </Container>
    </main>
  );
}
