import { ResultsClient } from "~/components/forms/results-client";

export default async function ResultsPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = await params;
  return <ResultsClient formId={formId} />;
}
