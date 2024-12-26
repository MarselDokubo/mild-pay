import { and, count, eq, gte } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "~/drizzle/db";
import { ProductTable, ProductViewTable } from "~/drizzle/schema";
import { CACHE_TAGS, getUserTag, revalidateCache } from "~/lib/cache";

export function getProductViewCount(userId: string, startDate: Date) {
  const cacheFn = unstable_cache(_getProductViewCount, undefined, {
    tags: [getUserTag(userId, CACHE_TAGS.productViews)],
  });

  return cacheFn(userId, startDate);
}

async function _getProductViewCount(userId: string, startDate: Date) {
  const counts = await db
    .select({ pricingViewCount: count() })
    .from(ProductViewTable)
    .innerJoin(ProductTable, eq(ProductTable.id, ProductViewTable.productId))
    .where(
      and(
        eq(ProductTable.clerkUserId, userId),
        gte(ProductViewTable.visitedAt, startDate)
      )
    );

  return counts[0]?.pricingViewCount ?? 0;
}

export async function createProductView({
  productId,
  countryId,
  userId,
}: {
  productId: string;
  countryId?: string;
  userId: string;
}) {
  const [newRow] = await db
    .insert(ProductViewTable)
    .values({
      productId: productId,
      visitedAt: new Date(),
      countryId: countryId,
    })
    .returning({ id: ProductViewTable.id });

  if (newRow != null) {
    revalidateCache({ tag: CACHE_TAGS.productViews, userId, id: newRow.id });
  }
}
