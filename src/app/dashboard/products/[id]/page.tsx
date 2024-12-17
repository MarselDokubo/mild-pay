export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;
  return (
    <>
      <div className="">
        Ahoy!! You're on the product page. The product ID is {id}
      </div>
    </>
  );
}
