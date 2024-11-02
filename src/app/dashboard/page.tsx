import { auth } from "@clerk/nextjs/server";
import { getProducts } from "~/server/db/products";
import { NoProducts } from "./_components/no-products";
import { Button } from "~/components/ui/button";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { ProductGrid } from "./_components/product-grid";

export default async function DashboardPage() {
  const { userId, redirectToSignIn } = await auth();
  if (userId == null) return redirectToSignIn();
  const products = await getProducts(userId, { limit: 6 });
  if (products.length === 0) return <NoProducts />;
  return (
    <>
      <h1 className="mb-6 text-3xl font-semibold flex justify-between">
        Products
        <Button asChild>
          <Link href="/dashboard/products/new">
            <PlusIcon className="size-4 mr-2" /> New Product
          </Link>
        </Button>
      </h1>
      <ProductGrid products={products} />
    </>
  );
}
