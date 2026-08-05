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
  "w-full border-0 border-b border-ink/15 bg-transparent px-0 py-3 text-[15px] leading-7 text-ink outline-none transition placeholder:text-ink/38 focus:border-copper";

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
    <form action={formAction} className="mt-4 space-y-4">
      <input type="hidden" name="token" value={token} />

      {isDone ? (
        <div className="border border-[#6f8a66]/20 bg-[#edf3eb] px-6 py-5 text-sm leading-6 text-ink/75 shadow-[0_4px_18px_rgba(32,25,20,0.04)] sm:px-12">
          <p className="inline-flex items-center gap-2 font-medium text-[#5f7a52]">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Thank you, your answers were sent.
          </p>
          <p className="mt-1">You can update anything below and resubmit if you need to.</p>
        </div>
      ) : null}

      {QUESTIONNAIRE_QUESTIONS.map((q) => (
        <label key={q.id} className="grid gap-5 bg-[#fbfaf7] px-6 py-8 shadow-[0_4px_18px_rgba(32,25,20,0.045)] sm:px-12 sm:py-10">
          <span className="text-base font-semibold leading-6 text-ink sm:text-[17px]">{q.label}</span>
          {q.multiline ? (
            <textarea name={q.id} defaultValue={responses[q.id] ?? ""} rows={2} placeholder={q.placeholder} className={`${fieldClass} min-h-20 resize-y`} />
          ) : (
            <input name={q.id} defaultValue={responses[q.id] ?? ""} placeholder={q.placeholder} className={fieldClass} />
          )}
        </label>
      ))}

      {state.status === "error" && state.message ? (
        <p className="border border-[#8a2f24]/15 bg-[#8a2f24]/8 px-6 py-4 text-sm text-[#8a2f24]">{state.message}</p>
      ) : null}

      <div className="flex justify-center pt-6">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-12 min-w-40 items-center justify-center gap-2 bg-ink px-8 text-xs font-semibold uppercase tracking-[0.16em] text-soft-white transition hover:bg-charcoal disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          {submitted ? "Update answers" : "Submit"}
        </button>
      </div>
    </form>
  );
}
