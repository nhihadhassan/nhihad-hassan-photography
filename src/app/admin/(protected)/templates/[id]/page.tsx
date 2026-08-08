import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getContractTemplateById } from "@/lib/contract-templates";
import { TemplateEditor } from "@/components/template-editor";

export const dynamic = "force-dynamic";

export default async function AdminTemplateEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const template = await getContractTemplateById(id);
  if (!template) notFound();

  return <TemplateEditor template={template} />;
}
