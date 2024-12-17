"use server";
import {
  productCountryDiscountsSchema,
  productCustomizationSchema,
  productDetailsSchema,
} from "~/schemas/products";
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

export async function deleteProduct(id: string) {
  const { userId } = await auth();
  const errorMessage = "There was an error deleting your product";
  const successMessage = "Successfully deleted your product";

  if (userId == null) {
    return { error: true, message: errorMessage };
  }

  const isSuccess = await db.deleteProduct({ id, userId });

  return {
    error: !isSuccess,
    message: isSuccess ? successMessage : errorMessage,
  };
}

export async function updateCountryDiscounts(
  id: string,
  unsafeData: z.infer<typeof productCountryDiscountsSchema>
) {
  const { userId } = await auth();
  const { success, data } = productCountryDiscountsSchema.safeParse(unsafeData);

  if (!success || userId == null) {
    return {
      error: true,
      message: "There was an error saving your country discounts",
    };
  }

  const insert: {
    countryGroupId: string;
    productId: string;
    coupon: string;
    discountPercentage: number;
  }[] = [];
  const deleteIds: { countryGroupId: string }[] = [];

  data.groups.forEach((group) => {
    if (
      group.coupon != null &&
      group.coupon.length > 0 &&
      group.discountPercentage != null &&
      group.discountPercentage > 0
    ) {
      insert.push({
        countryGroupId: group.countryGroupId,
        coupon: group.coupon,
        discountPercentage: group.discountPercentage / 100,
        productId: id,
      });
    } else {
      deleteIds.push({ countryGroupId: group.countryGroupId });
    }
  });

  await db.updateCountryDiscounts(deleteIds, insert, { productId: id, userId });

  return { error: false, message: "Country discounts saved" };
}

export async function updateProductCustomization(
  id: string,
  unsafeData: z.infer<typeof productCustomizationSchema>
) {
  const { userId } = await auth();
  const { success, data } = productCustomizationSchema.safeParse(unsafeData);
  // const canCustomize = await canCustomizeBanner(userId);
  const canCustomize = true;

  if (!success || userId == null || !canCustomize) {
    return {
      error: true,
      message: "There was an error updating your banner",
    };
  }

  await db.updateProductCustomization(data, { productId: id, userId });

  return { error: false, message: "Banner updated" };
}
