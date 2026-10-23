import { CatalogSkeleton } from "@/components/catalog/catalog-experience";
import { Container } from "@/components/ui/container";

export default function SearchLoading() {
  return (
    <main className="flex-1 pb-16 pt-4 md:pb-20 md:pt-5">
      <Container>
        <CatalogSkeleton />
      </Container>
    </main>
  );
}
