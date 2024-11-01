import { auth } from "@clerk/nextjs/server";
import { getProducts } from "~/server/db/products";
import { NoProducts } from "./_components/no-products";

export default async function DashboardPage() {
  const { userId, redirectToSignIn } = await auth();
  if (userId == null) return redirectToSignIn();
  const products = await getProducts(userId, { limit: 6 });
  if (products.length === 0) return <NoProducts />;
  return null;
}
