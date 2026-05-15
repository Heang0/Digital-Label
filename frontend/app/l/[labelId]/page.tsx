import { redirect } from 'next/navigation';

export default async function ShortLabelRoute({
  params,
  searchParams,
}: {
  params: Promise<{ labelId: string }>;
  searchParams?: Promise<{ force?: string }>;
}) {
  const { labelId } = await params;
  const query = searchParams ? await searchParams : {};
  
  if (query?.force === '1') {
    redirect(`/label-product/${labelId}?force=1`);
  }
  
  redirect(`/product-info/${labelId}`);
}
