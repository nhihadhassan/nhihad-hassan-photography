/** The fixed pre-shoot questionnaire. Plain module (no server-only) so the
 *  public form and the admin view can both import it. */
export type QuestionnaireQuestion = {
  id: string;
  label: string;
  placeholder: string;
  multiline?: boolean;
};

export const QUESTIONNAIRE_QUESTIONS: QuestionnaireQuestion[] = [
  {
    id: "timeline",
    label: "Timeline for the day",
    placeholder: "Rough schedule: start time, key moments, and when you'd like coverage to wrap.",
    multiline: true,
  },
  {
    id: "locations",
    label: "Location(s) and addresses",
    placeholder: "Where we'll be shooting, with addresses and any parking or access notes.",
    multiline: true,
  },
  {
    id: "people",
    label: "Key people and day-of contact",
    placeholder: "Who should I know (and a phone number for the best person to reach on the day).",
    multiline: true,
  },
  {
    id: "shots",
    label: "Must-have shots",
    placeholder: "Any specific moments, groupings, or details you definitely want captured.",
    multiline: true,
  },
  {
    id: "style",
    label: "Wardrobe and style notes",
    placeholder: "What you're planning to wear, and any look or vibe you're going for.",
    multiline: true,
  },
  {
    id: "other",
    label: "Anything else I should know",
    placeholder: "Sensitivities, surprises, accessibility needs, or anything on your mind.",
    multiline: true,
  },
];
