import { eq } from "drizzle-orm";
import { db } from "~/drizzle/db";
import { ProductCustomizationTable, ProductTable } from "~/drizzle/schema";
import { productDetailsSchema } from "~/schemas/products";

export function getProducts(userId: string, { limit }: { limit?: number }) {
  return db.query.ProductTable.findMany({
    where: ({ clerkUserId }, { eq }) => eq(clerkUserId, userId),
    orderBy: ({ createdAt }, { desc }) => desc(createdAt),
    limit,
  });
}

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
  return newProduct;
}
