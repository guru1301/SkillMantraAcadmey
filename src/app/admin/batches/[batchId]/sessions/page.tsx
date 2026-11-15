import { redirect } from 'next/navigation';

export default async function BatchSessionsPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const { batchId } = await params;
  redirect(`/admin/batches/${batchId}/attendance`);
}
