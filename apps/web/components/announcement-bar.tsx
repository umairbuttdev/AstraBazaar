import { ANNOUNCEMENT_ITEMS } from "@/lib/home-content";
import { Container } from "@/components/ui/container";

export function AnnouncementBar() {
  return (
    <div className="border-b border-ink/10 bg-ink text-foam">
      <Container className="flex items-center justify-center gap-6 overflow-hidden py-2 text-[11px] tracking-[0.14em] uppercase sm:justify-between sm:text-xs">
        <ul className="flex w-full items-center justify-center gap-4 overflow-x-auto scrollbar-none sm:gap-8 md:gap-12">
          {ANNOUNCEMENT_ITEMS.map((item, index) => (
            <li
              key={item}
              className={`shrink-0 whitespace-nowrap opacity-90 ${
                index > 1 ? "hidden sm:list-item" : ""
              }`}
            >
              {item}
            </li>
          ))}
        </ul>
      </Container>
    </div>
  );
}
