import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { PageWithBackButton } from "../../_components/page-with-back-button";
import { ProductDetailsForm } from "../../_components/form/product-details-form";
import { HasPermission } from "~/components/has-permissions";
import { canCreateProduct } from "~/server/permisions";

export default function NewProductPage() {
  return (
    <PageWithBackButton
      backButtonHref="/dashboard/products"
      pageTitle="Create Product"
    >
      <HasPermission
        permission={canCreateProduct}
        renderFallback
        fallbackText="You have already created the maximum number of products. Try upgrading your account to create more."
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Product Details</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductDetailsForm />
          </CardContent>
        </Card>
      </HasPermission>
    </PageWithBackButton>
  );
}
