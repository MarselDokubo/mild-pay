import { eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { subscriptionTiers } from "~/data/subscription-tiers";
import { db } from "~/drizzle/db";
import { ProductTable, UserSubscriptionTable } from "~/drizzle/schema";
import { CACHE_TAGS, getUserTag, revalidateCache } from "~/lib/cache";

export async function createUserSubscription(
  data: typeof UserSubscriptionTable.$inferInsert
) {
  const [newSubscription] = await db
    .insert(UserSubscriptionTable)
    .values(data)
    .onConflictDoNothing({
      target: UserSubscriptionTable.clerkUserId,
    })
    .returning({
      id: UserSubscriptionTable.id,
      userId: UserSubscriptionTable.clerkUserId,
    });

  revalidateCache({
    tag: CACHE_TAGS.subscription,
    userId: newSubscription.userId,
    id: newSubscription.id,
  });
  return newSubscription;
}

export async function deleteUser(clerkUserId: string) {
  db.batch([
    db
      .delete(UserSubscriptionTable)
      .where(eq(UserSubscriptionTable.clerkUserId, clerkUserId)),
    db.delete(ProductTable).where(eq(ProductTable.clerkUserId, clerkUserId)),
  ]);
}

export async function getUserSubscriptionTier(userId: string) {
  const subscription = await getUserSubscription(userId);

  if (subscription == null) throw new Error("User has no subscription");

  return subscriptionTiers[subscription.tier];
}

export async function getUserSubscription(userId: string) {
  const cacheFn = unstable_cache(_getUserSubscription, undefined, {
    tags: [getUserTag(userId, CACHE_TAGS.subscription)],
  });

  return cacheFn(userId);
}

async function _getUserSubscription(userId: string) {
  return await db.query.UserSubscriptionTable.findFirst({
    where: ({ clerkUserId }, { eq }) => eq(clerkUserId, userId),
  });
}
