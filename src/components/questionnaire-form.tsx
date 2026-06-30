"use client";

import { useActionState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { QUESTIONNAIRE_QUESTIONS } from "@/lib/questionnaire-questions";
import {
  submitQuestionnaireAction,
  type QuestionnaireState,
} from "@/app/questionnaire/[token]/actions";

const initial: QuestionnaireState = { status: "idle", message: "" };

const fieldClass =
  "w-full rounded-md border border-ink/20 bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-[#8b6444]";

export function QuestionnaireForm({
  token,
  responses,
  submitted,
}: {
  token: string;
  responses: Record<string, string>;
  submitted: boolean;
}) {
  const [state, formAction, pending] = useActionState(submitQuestionnaireAction, initial);

  const isDone = state.status === "success" || (submitted && state.status === "idle");

  return (
    <form action={formAction} className="mt-10 space-y-7">
      <input type="hidden" name="token" value={token} />

      {isDone ? (
        <div className="rounded-md border border-[#8b6444]/30 bg-white/60 p-5 text-sm leading-6 text-ink/75">
          <p className="inline-flex items-center gap-2 font-medium text-[#5f7a52]">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Thank you, your answers were sent.
          </p>
          <p className="mt-1">You can update anything below and resubmit if you need to.</p>
        </div>
      ) : null}

      {QUESTIONNAIRE_QUESTIONS.map((q) => (
        <label key={q.id} className="grid gap-1.5">
          <span className="text-sm font-medium text-ink">{q.label}</span>
          {q.multiline ? (
            <textarea name={q.id} defaultValue={responses[q.id] ?? ""} rows={3} placeholder={q.placeholder} className={`${fieldClass} resize-y leading-relaxed`} />
          ) : (
            <input name={q.id} defaultValue={responses[q.id] ?? ""} placeholder={q.placeholder} className={fieldClass} />
          )}
        </label>
      ))}

      {state.status === "error" && state.message ? (
        <p className="rounded-md bg-[#8a2f24]/8 px-3 py-2 text-sm text-[#8a2f24]">{state.message}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-6 text-sm font-medium text-soft-white transition hover:bg-ink/88 disabled:opacity-50"
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
        {submitted ? "Update answers" : "Send to Nhihad"}
      </button>
    </form>
  );
}
