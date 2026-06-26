import { FormRunner } from "~/components/forms/form-runner";

export default async function PublicFormPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <FormRunner slug={slug} />;
}
