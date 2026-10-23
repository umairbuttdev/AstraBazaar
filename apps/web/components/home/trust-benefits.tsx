import type { TrustBenefit } from "@/lib/home-content";
import { Container } from "@/components/ui/container";

type TrustBenefitsProps = {
  items: TrustBenefit[];
};

export function TrustBenefits({ items }: TrustBenefitsProps) {
  return (
    <section className="border-y border-border bg-surface py-8 md:py-10">
      <Container>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <li key={item.id} className="flex gap-3">
              <span
                className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary"
                aria-hidden
              />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {item.title}
                </p>
                <p className="text-body-sm mt-1 text-foreground-muted">
                  {item.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
