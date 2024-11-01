import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { PageWithBackButton } from "../../_components/page-with-back-button";
import { ProductDetailsForm } from "../../_components/form/product-details-form";

export default function NewProductPage() {
  return (
    <PageWithBackButton
      backButtonHref="/dashboard/products"
      pageTitle="Create Product"
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Product Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductDetailsForm />
        </CardContent>
      </Card>
    </PageWithBackButton>
  );
}
