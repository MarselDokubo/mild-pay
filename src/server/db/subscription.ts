import { eq } from "drizzle-orm";
import { db } from "~/drizzle/db";
import { ProductTable, UserSubscriptionTable } from "~/drizzle/schema";

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
