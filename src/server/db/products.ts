import { and, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "~/drizzle/db";
import { revalidateCache } from "~/lib/cache";
import { ProductCustomizationTable, ProductTable } from "~/drizzle/schema";
import { CACHE_TAGS, getUserTag } from "~/lib/cache";
import { productDetailsSchema } from "~/schemas/products";

export async function getProducts(
  userId: string,
  { limit }: { limit?: number }
) {
  const tag = getUserTag(userId, CACHE_TAGS.products);
  const cacheFn = unstable_cache(_getProducts, undefined, { tags: [tag] });

  return cacheFn(userId, { limit });
}

const _getProducts = async (userId: string, { limit }: { limit?: number }) => {
  return await db.query.ProductTable.findMany({
    where: ({ clerkUserId }, { eq }) => eq(clerkUserId, userId),
    orderBy: ({ createdAt }, { desc }) => desc(createdAt),
    limit,
  });
};

// _getProducts is cached internally and exposed using getProducts

export async function createProduct(product: typeof ProductTable.$inferInsert) {
  const [newProduct] = await db
    .insert(ProductTable)
    .values(product)
    .returning({ id: ProductTable.id, userId: ProductTable.clerkUserId });

  try {
    await db
      .insert(ProductCustomizationTable)
      .values({ productId: newProduct.id })
      .onConflictDoNothing({
        target: ProductCustomizationTable.productId,
      });
  } catch (error) {
    await db.delete(ProductTable).where(eq(ProductTable.id, newProduct.id));
  }
  revalidateCache({
    tag: CACHE_TAGS.products,
    userId: newProduct.userId,
    id: newProduct.id,
  });
  return newProduct;
}

export async function deleteProduct({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  const { rowCount } = await db
    .delete(ProductTable)
    .where(and(eq(ProductTable.id, id), eq(ProductTable.clerkUserId, userId)));
  if (rowCount > 0) {
    revalidateCache({
      tag: CACHE_TAGS.products,
      userId,
      id,
    });
  }
  return rowCount > 0;
}
