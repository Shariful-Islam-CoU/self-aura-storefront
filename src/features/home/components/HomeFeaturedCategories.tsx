import { Container } from "@/components/layout/Container";
import { Reveal } from "@/components/ui/Reveal";
import { CategoryCard } from "./CategoryCard";
import type { Category } from "@/types";

interface HomeFeaturedCategoriesProps {
  categories: Category[];
}

export function HomeFeaturedCategories({ categories }: HomeFeaturedCategoriesProps) {
  const displayCategories = categories.slice(0, 8);
  return (
    <section id="categories" aria-labelledby="categories-heading" className="scroll-mt-24 py-16 sm:py-24">
      <Container>
        <Reveal>
          <div className="max-w-xl">
            <p className="text-xs font-label uppercase tracking-[0.18em] text-accent">Curated for you</p>
            <h2 id="categories-heading" className="mt-2 font-display text-3xl tracking-tight text-foreground sm:text-4xl">
              Shop by Category
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Browse the edit you love.
            </p>
          </div>
        </Reveal>

        <Reveal delay={80}>
          {displayCategories.length > 0 ? (
            <ul role="list" className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {displayCategories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </ul>
          ) : (
            <p className="mt-10 text-sm text-muted-foreground">No categories available at the moment.</p>
          )}
        </Reveal>
      </Container>
    </section>
  );
}