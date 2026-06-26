import { z } from "zod";

export const questionTypes = [
  "short_text",
  "long_text",
  "email",
  "number",
  "single_choice",
  "multiple_choice",
  "dropdown",
  "date",
  "rating",
  "yes_no",
] as const;

export const questionTypeSchema = z.enum(questionTypes);
export const formStatusSchema = z.enum(["draft", "published"]);
export const formVisibilitySchema = z.enum(["public", "unlisted"]);

export const uuidSchema = z.string().uuid();

export const formThemeInputSchema = z
  .object({
    background: z.string().min(1).max(40).optional(),
    text: z.string().min(1).max(40).optional(),
    accent: z.string().min(1).max(40).optional(),
    preset: z.string().min(1).max(40).optional(),
  })
  .strict();

export const formThemeSchema = z.object({
  background: z.string(),
  text: z.string(),
  accent: z.string(),
  preset: z.string().optional(),
});

export const formSettingsInputSchema = z
  .object({
    showProgress: z.boolean().optional(),
    collectEmail: z.boolean().optional(),
    expiresAt: z.string().datetime().nullable().optional(),
    responseLimit: z.number().int().min(1).max(100000).nullable().optional(),
  })
  .strict();

export const formSettingsSchema = z.object({
  showProgress: z.boolean(),
  collectEmail: z.boolean(),
  expiresAt: z.string().datetime().nullable().optional(),
  responseLimit: z.number().int().min(1).max(100000).nullable().optional(),
});

export const questionValidationInputSchema = z
  .object({
    minLength: z.number().int().min(0).max(10000).nullable().optional(),
    maxLength: z.number().int().min(1).max(10000).nullable().optional(),
    min: z.number().nullable().optional(),
    max: z.number().nullable().optional(),
    pattern: z.string().trim().max(300).nullable().optional(),
  })
  .strict()
  .refine(
    (value) =>
      value.minLength == null || value.maxLength == null || value.minLength <= value.maxLength,
    "Minimum length cannot be greater than maximum length",
  )
  .refine(
    (value) => value.min == null || value.max == null || value.min <= value.max,
    "Minimum value cannot be greater than maximum value",
  );

export const questionValidationSchema = z.object({
  minLength: z.number().int().min(0).max(10000).nullable().optional(),
  maxLength: z.number().int().min(1).max(10000).nullable().optional(),
  min: z.number().nullable().optional(),
  max: z.number().nullable().optional(),
  pattern: z.string().nullable().optional(),
});

export const jsonObjectSchema = z.record(z.string(), z.unknown());
export const dateStringSchema = z.string().nullable();

export const createFormInputSchema = z.object({
  title: z.string().trim().min(1).max(180),
  description: z.string().trim().max(1000).nullable().optional(),
  visibility: formVisibilitySchema.optional(),
  theme: formThemeInputSchema.optional(),
  settings: formSettingsInputSchema.optional(),
});

export const updateFormInputSchema = z.object({
  id: uuidSchema,
  title: z.string().trim().min(1).max(180).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens")
    .optional(),
  visibility: formVisibilitySchema.optional(),
  theme: formThemeInputSchema.optional(),
  settings: formSettingsInputSchema.optional(),
});

export const questionOptionInputSchema = z.object({
  id: uuidSchema.optional(),
  label: z.string().trim().min(1).max(140),
  value: z.string().trim().min(1).max(140),
  position: z.number().int().min(0).optional(),
});

export const builderQuestionInputSchema = z.object({
  id: uuidSchema.optional(),
  type: questionTypeSchema,
  title: z.string().trim().min(1).max(280),
  description: z.string().trim().max(1000).nullable().optional(),
  required: z.boolean().default(false),
  position: z.number().int().min(0).optional(),
  placeholder: z.string().trim().max(160).nullable().optional(),
  helpText: z.string().trim().max(500).nullable().optional(),
  validation: questionValidationInputSchema.optional(),
  options: z.array(questionOptionInputSchema).max(60).optional(),
});

export const saveBuilderInputSchema = z.object({
  formId: uuidSchema,
  title: z.string().trim().min(1).max(180),
  description: z.string().trim().max(1000).nullable().optional(),
  visibility: formVisibilitySchema.optional(),
  theme: formThemeInputSchema.optional(),
  settings: formSettingsInputSchema.optional(),
  questions: z.array(builderQuestionInputSchema).min(1).max(100),
});

export const publishFormInputSchema = z.object({
  formId: uuidSchema,
});

export const deleteFormInputSchema = z.object({
  formId: uuidSchema,
});

export const deleteFormOutputSchema = z.object({
  success: z.boolean(),
});

export const formListItemSchema = z.object({
  id: uuidSchema,
  title: z.string(),
  description: z.string().nullable(),
  slug: z.string(),
  status: formStatusSchema,
  visibility: formVisibilitySchema,
  theme: formThemeSchema,
  settings: formSettingsSchema,
  publishedAt: dateStringSchema,
  createdAt: dateStringSchema,
  updatedAt: dateStringSchema,
});

export const questionOptionSchema = z.object({
  id: uuidSchema,
  questionId: uuidSchema,
  label: z.string(),
  value: z.string(),
  position: z.number().int(),
});

export const formQuestionSchema = z.object({
  id: uuidSchema,
  formId: uuidSchema,
  type: questionTypeSchema,
  title: z.string(),
  description: z.string().nullable(),
  required: z.boolean(),
  position: z.number().int(),
  placeholder: z.string().nullable(),
  helpText: z.string().nullable(),
  validation: questionValidationSchema,
  options: z.array(questionOptionSchema),
});

export const formDetailSchema = formListItemSchema.extend({
  questions: z.array(formQuestionSchema),
});

export const answerValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
  z.null(),
]);

export const submitFormInputSchema = z.object({
  slug: z.string().min(1).max(160),
  answers: z
    .array(
      z.object({
        questionId: uuidSchema,
        value: answerValueSchema,
      }),
    )
    .max(200),
  metadata: jsonObjectSchema.optional(),
});

export const submitFormOutputSchema = z.object({
  responseId: uuidSchema,
  submittedAt: dateStringSchema,
});

export const formAnswerSchema = z.object({
  id: uuidSchema,
  responseId: uuidSchema,
  questionId: uuidSchema.nullable(),
  questionTitle: z.string().nullable(),
  value: answerValueSchema,
  createdAt: dateStringSchema,
});

export const formResponseSchema = z.object({
  id: uuidSchema,
  formId: uuidSchema,
  submittedAt: dateStringSchema,
  metadata: jsonObjectSchema,
  answers: z.array(formAnswerSchema),
});

export const questionSummarySchema = z.object({
  questionId: uuidSchema,
  title: z.string(),
  type: questionTypeSchema,
  responseCount: z.number().int().min(0),
  counts: z.record(z.string(), z.number().int().min(0)),
});

export const formSummarySchema = z.object({
  formId: uuidSchema,
  totalResponses: z.number().int().min(0),
  questionCount: z.number().int().min(0),
  questions: z.array(questionSummarySchema),
});

export const exportResponsesOutputSchema = z.object({
  filename: z.string(),
  csv: z.string(),
});

export type QuestionType = z.infer<typeof questionTypeSchema>;
export type FormStatus = z.infer<typeof formStatusSchema>;
export type FormVisibility = z.infer<typeof formVisibilitySchema>;
export type FormTheme = z.infer<typeof formThemeSchema>;
export type FormSettings = z.infer<typeof formSettingsSchema>;
export type QuestionValidation = z.infer<typeof questionValidationSchema>;
export type CreateFormInput = z.infer<typeof createFormInputSchema>;
export type UpdateFormInput = z.infer<typeof updateFormInputSchema>;
export type SaveBuilderInput = z.infer<typeof saveBuilderInputSchema>;
export type DeleteFormInput = z.infer<typeof deleteFormInputSchema>;
export type FormListItem = z.infer<typeof formListItemSchema>;
export type FormQuestion = z.infer<typeof formQuestionSchema>;
export type FormDetail = z.infer<typeof formDetailSchema>;
export type SubmitFormInput = z.infer<typeof submitFormInputSchema>;
export type SubmitFormOutput = z.infer<typeof submitFormOutputSchema>;
export type FormResponse = z.infer<typeof formResponseSchema>;
export type FormSummary = z.infer<typeof formSummarySchema>;
