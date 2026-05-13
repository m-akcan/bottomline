import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { CategoryEditor } from "@/components/projects/CategoryEditor";
import { listCategories } from "@/lib/queries/entries";

export default function CategoriesSettingsPage() {
  const categories = listCategories();
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link href="/settings" className="text-xs text-muted hover:text-ink w-fit">
          ← Settings
        </Link>
        <h1 className="text-3xl tracking-tight font-medium">Categories</h1>
        <p className="text-sm text-muted max-w-xl">
          Group expenses by category to see where the money goes. Deleting a category
          leaves its entries categorized as uncategorized.
        </p>
      </header>
      <Card tabbed>
        <CategoryEditor categories={categories} />
      </Card>
    </div>
  );
}
