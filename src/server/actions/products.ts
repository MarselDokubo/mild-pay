"use server";
import { productDetailsSchema } from "~/schemas/products";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import * as db from "../db/products";
import { redirect } from "next/navigation";

export async function createProduct(
  product: z.infer<typeof productDetailsSchema>
): Promise<{ error: boolean; message: string } | undefined> {
  const { userId } = await auth();
  const { success, data } = productDetailsSchema.safeParse(product);

  if (!success || userId == null)
    return { error: true, message: "There was an error creating your product" };

  const { id } = await db.createProduct({ ...data, clerkUserId: userId });
  redirect(`/dashboard/products/${id}/edit?tab=countries`);
}
