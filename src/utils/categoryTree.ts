import type {
  ApiAdditionalCategoryNode,
  ApiCategoryMain,
  ApiCategoryTreeMain,
} from "@/api/admins";
import type { AdditionalCategory, Category, SubCategory, ThirdSubCategory } from "@/types";

/** Normalize Mongo ids from JSON (string, or rare nested shapes) for reliable Select matching. */
export function toIdString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "object" && "$oid" in (value as object)) {
    return String((value as { $oid: string }).$oid);
  }
  return String(value);
}

function slugify(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

export function mainCategoriesToRows(mains: ApiCategoryMain[]): Category[] {
  return mains.map((m) => ({
    id: toIdString(m._id),
    name: m.name,
    slug: slugify(m.name),
    description: m.description,
    createdAt: m.createdAt ?? new Date().toISOString(),
    updatedAt: m.updatedAt ?? m.createdAt ?? new Date().toISOString(),
  }));
}

export function flattenSubsAndThirds(mains: ApiCategoryMain[]): {
  subCategories: SubCategory[];
  thirdSubCategories: ThirdSubCategory[];
} {
  const subCategories: SubCategory[] = [];
  const thirdSubCategories: ThirdSubCategory[] = [];

  for (const main of mains) {
    const mainId = toIdString(main._id);
    const mainName = main.name;
    for (const sub of main.subCategories ?? []) {
      const subId = toIdString(sub._id);
      subCategories.push({
        id: subId,
        name: sub.name,
        slug: slugify(sub.name),
        categoryId: mainId,
        categoryName: mainName,
        description: sub.description,
        createdAt: sub.createdAt ?? new Date().toISOString(),
        updatedAt: sub.updatedAt ?? sub.createdAt ?? new Date().toISOString(),
      });
      for (const third of sub.thirdCategories ?? []) {
        thirdSubCategories.push({
          id: toIdString(third._id),
          name: third.name,
          slug: slugify(third.name),
          subCategoryId: subId,
          subCategoryName: sub.name,
          categoryId: mainId,
          categoryName: mainName,
          description: third.description,
          createdAt: third.createdAt ?? new Date().toISOString(),
          updatedAt: third.updatedAt ?? third.createdAt ?? new Date().toISOString(),
        });
      }
    }
  }

  return { subCategories, thirdSubCategories };
}

export type MainOption = { id: string; name: string };
export type SubOption = { id: string; name: string; categoryId: string };
export type ThirdOption = {
  id: string;
  name: string;
  subCategoryId: string;
  categoryId: string;
};

export function categorySelectOptions(mains: ApiCategoryMain[]) {
  const mainOptions: MainOption[] = mains.map((m) => ({
    id: toIdString(m._id),
    name: m.name,
  }));
  const subOptions: SubOption[] = [];
  const thirdOptions: ThirdOption[] = [];
  for (const main of mains) {
    const mainId = toIdString(main._id);
    for (const sub of main.subCategories ?? []) {
      const subId = toIdString(sub._id);
      subOptions.push({ id: subId, name: sub.name, categoryId: mainId });
      for (const third of sub.thirdCategories ?? []) {
        thirdOptions.push({
          id: toIdString(third._id),
          name: third.name,
          subCategoryId: subId,
          categoryId: mainId,
        });
      }
    }
  }
  return { mainOptions, subOptions, thirdOptions };
}

/** Breadcrumb options for picking a third category (parent = third name). */
export function thirdCategoryBreadcrumbOptions(
  tree: ApiCategoryTreeMain[]
): { label: string; thirdName: string }[] {
  const opts: { label: string; thirdName: string }[] = [];
  for (const main of tree) {
    for (const sub of main.subCategories ?? []) {
      for (const third of sub.thirdCategories ?? []) {
        opts.push({
          label: `${main.name} › ${sub.name} › ${third.name}`,
          thirdName: third.name,
        });
      }
    }
  }
  return opts;
}

/** Flatten category tree for additional category table. */
export function flattenAdditionalCategoriesFromTree(
  tree: ApiCategoryTreeMain[]
): AdditionalCategory[] {
  const rows: AdditionalCategory[] = [];

  function walk(
    nodes: ApiAdditionalCategoryNode[] | undefined,
    ctx: { mainName: string; subName: string; thirdName: string },
    immediateParentName: string
  ) {
    if (!nodes?.length) return;
    for (const node of nodes) {
      rows.push({
        id: toIdString(node._id),
        name: node.name,
        slug: slugify(node.name),
        parentCategoryId:
          node.parentCategory != null ? toIdString(node.parentCategory) : undefined,
        parentName: immediateParentName,
        parentModel:
          (node.parentModel as "ThirdCategory" | "AdditionalCategory") ??
          "ThirdCategory",
        level: node.level ?? 4,
        description: node.description,
        mainCategoryName: ctx.mainName,
        subCategoryName: ctx.subName,
        thirdCategoryName: ctx.thirdName,
        createdAt: node.createdAt ?? new Date().toISOString(),
        updatedAt: node.updatedAt ?? node.createdAt ?? new Date().toISOString(),
      });
      if (node.children?.length) {
        walk(node.children, ctx, node.name);
      }
    }
  }

  for (const main of tree) {
    const mainName = main.name;
    for (const sub of main.subCategories ?? []) {
      const subName = sub.name;
      for (const third of sub.thirdCategories ?? []) {
        walk(third.additionalCategories, { mainName, subName, thirdName: third.name }, third.name);
      }
    }
  }
  return rows;
}

/** Options for product additional categories dropdown. */
export type AdditionalCategorySelectOption = {
  name: string;
  label: string;
  /** Third-level category name this additional row belongs under. */
  thirdName: string;
};

export function additionalCategorySelectOptions(
  tree: ApiCategoryTreeMain[]
): AdditionalCategorySelectOption[] {
  const rows = flattenAdditionalCategoriesFromTree(tree);
  return rows
    .map((r) => ({
      name: r.name,
      thirdName: r.thirdCategoryName,
      label: `${r.mainCategoryName} › ${r.subCategoryName} › ${r.thirdCategoryName} › ${r.name}`,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
