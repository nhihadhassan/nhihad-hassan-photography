"use server";

import { revalidatePath } from "next/cache";
import { submitQuestionnaire } from "@/lib/questionnaires";
import { QUESTIONNAIRE_QUESTIONS } from "@/lib/questionnaire-questions";

export type QuestionnaireState = { status: "idle" | "success" | "error"; message: string };

export async function submitQuestionnaireAction(
  _prev: QuestionnaireState,
  formData: FormData,
): Promise<QuestionnaireState> {
  const token = String(formData.get("token") ?? "");
  if (!token) return { status: "error", message: "Missing token." };

  const responses: Record<string, string> = {};
  for (const q of QUESTIONNAIRE_QUESTIONS) {
    const v = formData.get(q.id);
    if (typeof v === "string") responses[q.id] = v;
  }

  const result = await submitQuestionnaire(token, responses);
  if (!result.ok) return { status: "error", message: result.message };
  revalidatePath(`/questionnaire/${token}`);
  return { status: "success", message: "Thank you, your answers were sent." };
}
