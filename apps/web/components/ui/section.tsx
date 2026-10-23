import type { ReactNode } from "react";
import { Container } from "./container";

type SectionProps = {
  id?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  headerAction?: ReactNode;
};

export function Section({
  id,
  eyebrow,
  title,
  description,
  children,
  className = "",
  headerAction,
}: SectionProps) {
  return (
    <section id={id} className={`py-14 md:py-20 ${className}`}>
      <Container>
        {(eyebrow || title || description || headerAction) && (
          <div className="mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              {eyebrow ? (
                <p className="text-caption text-primary">{eyebrow}</p>
              ) : null}
              {title ? <h2 className="text-h2 mt-2 text-foreground">{title}</h2> : null}
              {description ? (
                <p className="text-body mt-3 text-foreground-muted">
                  {description}
                </p>
              ) : null}
            </div>
            {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
          </div>
        )}
        {children}
      </Container>
    </section>
  );
}
