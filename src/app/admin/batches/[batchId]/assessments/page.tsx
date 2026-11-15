import { redirect } from 'next/navigation';

export default async function BatchAssessmentsPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const { batchId } = await params;
  redirect(`/admin/batches/${batchId}`);
}
