import { and, count, eq, inArray, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "~/drizzle/db";
import { getGlobalTag, getIdTag, revalidateCache } from "~/lib/cache";
import {
  CountryGroupDiscountTable,
  ProductCustomizationTable,
  ProductTable,
} from "~/drizzle/schema";
import { CACHE_TAGS, getUserTag } from "~/lib/cache";
import { productDetailsSchema } from "~/schemas/products";
import { BatchItem } from "drizzle-orm/batch";
import { removeTrailingSlash } from "~/lib/utils";

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

export async function getProduct(productId: string, userId: string) {
  const productTag = getIdTag(productId, CACHE_TAGS.products);
  const cacheFn = unstable_cache(_getProduct, undefined, {
    tags: [productTag],
  });
  return cacheFn(productId, userId);
}

const _getProduct = async (productId: string, userId: string) => {
  return await db.query.ProductTable.findFirst({
    where: ({ clerkUserId, id }, { eq, and }) =>
      and(eq(clerkUserId, userId), eq(id, productId)),
  });
};

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

export async function updateCountryDiscounts(
  deleteGroup: { countryGroupId: string }[],
  insertGroup: (typeof CountryGroupDiscountTable.$inferInsert)[],
  { productId, userId }: { productId: string; userId: string }
) {
  const product = await getProduct(productId, userId);
  if (product == null) return false;

  const statements: BatchItem<"pg">[] = [];
  if (deleteGroup.length > 0) {
    statements.push(
      db.delete(CountryGroupDiscountTable).where(
        and(
          eq(CountryGroupDiscountTable.productId, productId),
          inArray(
            CountryGroupDiscountTable.countryGroupId,
            deleteGroup.map((group) => group.countryGroupId)
          )
        )
      )
    );
  }

  if (insertGroup.length > 0) {
    statements.push(
      db
        .insert(CountryGroupDiscountTable)
        .values(insertGroup)
        .onConflictDoUpdate({
          target: [
            CountryGroupDiscountTable.productId,
            CountryGroupDiscountTable.countryGroupId,
          ],
          set: {
            coupon: sql.raw(
              `excluded.${CountryGroupDiscountTable.coupon.name}`
            ),
            discountPercentage: sql.raw(
              `excluded.${CountryGroupDiscountTable.discountPercentage.name}`
            ),
          },
        })
    );
  }

  if (statements.length > 0) {
    await db.batch(statements as [BatchItem<"pg">]);
  }

  revalidateCache({
    tag: CACHE_TAGS.products,
    userId,
    id: productId,
  });
}

export async function getProductCountryGroups(
  productId: string,
  userId: string
) {
  const cacheFn = unstable_cache(_getProductCountryGroups, undefined, {
    tags: [
      getIdTag(productId, CACHE_TAGS.products),
      getGlobalTag(CACHE_TAGS.countries),
      getGlobalTag(CACHE_TAGS.countryGroups),
    ],
  });

  return cacheFn(productId, userId);
}

async function _getProductCountryGroups(productId: string, userId: string) {
  const product = await getProduct(productId, userId);
  if (product == null) return [];

  const data = await db.query.CountryGroupTable.findMany({
    with: {
      countries: {
        columns: {
          name: true,
          code: true,
        },
      },
      countryGroupDiscounts: {
        columns: {
          coupon: true,
          discountPercentage: true,
        },
        where: ({ productId: id }, { eq }) => eq(id, productId),
        limit: 1,
      },
    },
  });

  return data.map((group) => {
    return {
      id: group.id,
      name: group.name,
      recommendedDiscountPercentage: group.recommendedDiscountPercentage,
      countries: group.countries,
      discount: group.countryGroupDiscounts.at(0),
    };
  });
}

export async function getProductCustomization(
  userId: string,
  productId: string
) {
  const cacheFn = unstable_cache(_getProductCustomization, undefined, {
    tags: [getIdTag(productId, CACHE_TAGS.products)],
  });
  return cacheFn(userId, productId);
}

async function _getProductCustomization(userId: string, productId: string) {
  const data = await db.query.ProductTable.findFirst({
    where: ({ id, clerkUserId }, { and, eq }) =>
      and(eq(id, productId), eq(clerkUserId, userId)),
    with: {
      productCustomization: true,
    },
  });

  return data?.productCustomization;
}

export async function updateProductCustomization(
  data: Partial<typeof ProductCustomizationTable.$inferInsert>,
  { productId, userId }: { productId: string; userId: string }
) {
  const product = await getProduct(productId, userId);
  if (product == null) return;

  await db
    .update(ProductCustomizationTable)
    .set(data)
    .where(eq(ProductCustomizationTable.productId, productId));

  revalidateCache({
    tag: CACHE_TAGS.products,
    userId,
    id: productId,
  });
}

export function getProductCount(userId: string) {
  const cacheFn = unstable_cache(_getProductCount, undefined, {
    tags: [getUserTag(userId, CACHE_TAGS.products)],
  });

  return cacheFn(userId);
}

async function _getProductCount(userId: string) {
  const counts = await db
    .select({ productCount: count() })
    .from(ProductTable)
    .where(eq(ProductTable.clerkUserId, userId));

  return counts[0]?.productCount ?? 0;
}

export async function getProductForBanner({
  id,
  countryCode,
  url,
}: {
  id: string;
  countryCode: string;
  url: string;
}) {
  const cacheFn = unstable_cache(_getProductForBanner, undefined, {
    tags: [
      getIdTag(id, CACHE_TAGS.products),
      getGlobalTag(CACHE_TAGS.countries),
      getGlobalTag(CACHE_TAGS.countryGroups),
    ],
  });

  return cacheFn({
    id,
    countryCode,
    url,
  });
}

async function _getProductForBanner({
  id,
  countryCode,
  url,
}: {
  id: string;
  countryCode: string;
  url: string;
}) {
  const data = await db.query.ProductTable.findFirst({
    where: ({ id: idCol, url: urlCol }, { eq, and }) =>
      and(eq(idCol, id), eq(urlCol, removeTrailingSlash(url))),
    columns: {
      id: true,
      clerkUserId: true,
    },
    with: {
      productCustomization: true,
      countryGroupDiscounts: {
        columns: {
          coupon: true,
          discountPercentage: true,
        },
        with: {
          countryGroup: {
            columns: {},
            with: {
              countries: {
                columns: {
                  id: true,
                  name: true,
                },
                limit: 1,
                where: ({ code }, { eq }) => eq(code, countryCode),
              },
            },
          },
        },
      },
    },
  });

  const discount = data?.countryGroupDiscounts.find(
    (discount) => discount.countryGroup.countries.length > 0
  );
  const country = discount?.countryGroup.countries[0];
  const product =
    data == null || data.productCustomization == null
      ? undefined
      : {
          id: data.id,
          clerkUserId: data.clerkUserId,
          customization: data.productCustomization,
        };

  return {
    product,
    country,
    discount:
      discount == null
        ? undefined
        : {
            coupon: discount.coupon,
            percentage: discount.discountPercentage,
          },
  };
}
