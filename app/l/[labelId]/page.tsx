import { redirect } from 'next/navigation';

export default async function ShortLabelRoute({
  params,
}: {
  params: Promise<{ labelId: string }>;
}) {
  const { labelId } = await params;
  redirect(`/label-product/${labelId}`);
}
