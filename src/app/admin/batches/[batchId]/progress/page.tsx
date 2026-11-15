import { redirect } from 'next/navigation';

export default async function BatchProgressPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const { batchId } = await params;
  redirect(`/admin/batches/${batchId}`);
}
