import { PromoBanner } from "@/components/ui/promo-banner";
import { Section } from "@/components/ui/section";
import type { HomePromo } from "@/lib/home-content";

type PromoSectionProps = {
  promos: HomePromo[];
};

export function PromoSection({ promos }: PromoSectionProps) {
  if (promos.length === 0) {
    return null;
  }

  return (
    <Section
      id="collections"
      eyebrow="Collections"
      title="Promotional edits"
      description="Campaign tiles linked to live category and brand filters."
      className="bg-surface"
    >
      <div className="grid gap-4 md:grid-cols-3 md:gap-6">
        {promos.map((promo) => (
          <PromoBanner
            key={promo.id}
            title={promo.title}
            description={promo.description}
            href={promo.href}
            imageUrl={promo.imageUrl}
            imageAlt={promo.imageAlt}
          />
        ))}
      </div>
    </Section>
  );
}
