import type { CalculatedBlock, Category } from '@/types';

export const UNCATEGORIZED_CATEGORY_ID = '__uncategorized__';

export function resolveCategoryIdForBlock(
  blocks: { id: string; category_id?: string | null }[],
  parentId: string | null,
  selectedCategoryId: string
): string | null {
  if (parentId) {
    const parent = blocks.find((block) => block.id === parentId);
    return parent?.category_id ?? (selectedCategoryId || null);
  }
  return selectedCategoryId || null;
}

export interface CategorySection {
  id: string;
  name: string;
  visibleCompleted: CalculatedBlock[];
  active: CalculatedBlock[];
}

export function buildCategorySections(
  categories: Category[],
  visibleCompletedBlocks: CalculatedBlock[],
  activeBlocks: CalculatedBlock[]
): CategorySection[] {
  const sections: CategorySection[] = categories.map((category) => ({
    id: category.id,
    name: category.name,
    visibleCompleted: visibleCompletedBlocks.filter((root) => root.category_id === category.id),
    active: activeBlocks.filter((root) => root.category_id === category.id),
  }));

  const uncategorizedCompleted = visibleCompletedBlocks.filter((root) => !root.category_id);
  const uncategorizedActive = activeBlocks.filter((root) => !root.category_id);

  if (uncategorizedCompleted.length > 0 || uncategorizedActive.length > 0) {
    sections.push({
      id: UNCATEGORIZED_CATEGORY_ID,
      name: 'Sem categoria',
      visibleCompleted: uncategorizedCompleted,
      active: uncategorizedActive,
    });
  }

  return sections.filter(
    (section) => section.visibleCompleted.length > 0 || section.active.length > 0
  );
}

export function getCategoryLabel(
  block: { category_id?: string | null; category?: Category | null },
  categories: Category[]
): string | null {
  if (block.category?.name) return block.category.name;
  if (!block.category_id) return null;
  return categories.find((category) => category.id === block.category_id)?.name ?? null;
}
