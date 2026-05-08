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
  const force = query?.force === '1' ? '?force=1' : '';
  redirect(`/label-product/${labelId}${force}`);
}
