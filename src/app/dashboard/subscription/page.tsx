import { auth } from "@clerk/nextjs/server";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { subscriptionTiers } from "~/data/subscription-tiers";
import { createCustomerPortalSession } from "~/server/actions/stripe";
import { getProductViewCount } from "~/server/db/product-views";
import { getProductCount } from "~/server/db/products";
import { getUserSubscriptionTier } from "~/server/db/subscription";
import { startOfMonth, subDays } from "date-fns";

export default async function UserSubscription() {
  const { userId, redirectToSignIn } = await auth();
  if (userId == null) return redirectToSignIn();
  const tier = await getUserSubscriptionTier(userId);
  const productCount = await getProductCount(userId);
  const pricingViewCount = await getProductViewCount(
    userId,
    startOfMonth(new Date())
  );
  return (
    <>
      <h1 className="mb-6 text-3xl font-semibold">Your Subscription</h1>
      <div className="flex flex-col gap-8 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Monthly Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={35} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Number of Products</CardTitle>
              <CardDescription>X products created</CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={40} />
            </CardContent>
          </Card>
        </div>
        {tier != subscriptionTiers.Free && (
          <Card>
            <CardHeader>
              <CardTitle>You are currently on the {tier.name} plan</CardTitle>
              <CardDescription>
                If you would like to upgrade, cancel, or change your payment
                method use the button below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createCustomerPortalSession}>
                <Button
                  variant="accent"
                  className="text-lg rounded-lg"
                  size="lg"
                >
                  Manage Subscription
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
