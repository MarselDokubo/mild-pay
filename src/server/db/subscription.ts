import { eq } from "drizzle-orm";
import { db } from "~/drizzle/db";
import { ProductTable, UserSubscriptionTable } from "~/drizzle/schema";
import { CACHE_TAGS, revalidateCache } from "~/lib/cache";

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
    tag: CACHE_TAGS.subscriptions,
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
