import { and, asc, db, desc, eq, inArray } from "@repo/database";
import {
  formAnswersTable,
  formQuestionsTable,
  formResponsesTable,
  formsTable,
  questionOptionsTable,
  usersTable,
} from "@repo/database/schema";

import {
  answerValueSchema,
  FormResponse,
  FormSummary,
  QuestionValidation,
  QuestionType,
  SubmitFormOutput,
  submitFormInputSchema,
} from "../forms/model";
import { emailService } from "../emails";

type QuestionRow = typeof formQuestionsTable.$inferSelect;
type AnswerRow = typeof formAnswersTable.$inferSelect;

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return new Date(value).toISOString();
}

function objectValue(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function normalizeSettings(value: unknown) {
  const object = objectValue(value);
  return {
    expiresAt: typeof object.expiresAt === "string" ? object.expiresAt : null,
    responseLimit:
      typeof object.responseLimit === "number" && Number.isInteger(object.responseLimit)
        ? object.responseLimit
        : null,
  };
}

function normalizeValidation(value: unknown): QuestionValidation {
  const object = objectValue(value);
  return {
    minLength:
      typeof object.minLength === "number" && Number.isInteger(object.minLength)
        ? object.minLength
        : null,
    maxLength:
      typeof object.maxLength === "number" && Number.isInteger(object.maxLength)
        ? object.maxLength
        : null,
    min: typeof object.min === "number" ? object.min : null,
    max: typeof object.max === "number" ? object.max : null,
    pattern: typeof object.pattern === "string" && object.pattern.trim() ? object.pattern : null,
  };
}

function assertCustomValidation(question: QuestionRow, value: unknown): void {
  if (isEmpty(value)) return;

  const validation = normalizeValidation(question.validation);

  if (typeof value === "string") {
    if (validation.minLength != null && value.length < validation.minLength) {
      throw new Error(`${question.title} must be at least ${validation.minLength} characters`);
    }

    if (validation.maxLength != null && value.length > validation.maxLength) {
      throw new Error(`${question.title} must be at most ${validation.maxLength} characters`);
    }

    if (validation.pattern) {
      let expression: RegExp;
      try {
        expression = new RegExp(validation.pattern);
      } catch {
        throw new Error(`${question.title} has an invalid validation pattern`);
      }

      if (!expression.test(value)) throw new Error(`${question.title} format is invalid`);
    }
  }

  if (typeof value === "number") {
    if (validation.min != null && value < validation.min) {
      throw new Error(`${question.title} must be at least ${validation.min}`);
    }

    if (validation.max != null && value > validation.max) {
      throw new Error(`${question.title} must be at most ${validation.max}`);
    }
  }
}

function findRespondentEmail(
  metadata: Record<string, unknown>,
  answersByQuestion: Map<string, unknown>,
  questions: QuestionRow[],
): string | null {
  const metadataEmail =
    typeof metadata.respondentEmail === "string"
      ? metadata.respondentEmail
      : typeof metadata.email === "string"
        ? metadata.email
        : null;

  if (metadataEmail && /^\S+@\S+\.\S+$/.test(metadataEmail)) return metadataEmail;

  const emailQuestion = questions.find((question) => question.type === "email");
  if (!emailQuestion) return null;

  const emailAnswer = answersByQuestion.get(emailQuestion.id);
  return typeof emailAnswer === "string" && /^\S+@\S+\.\S+$/.test(emailAnswer)
    ? emailAnswer
    : null;
}

function assertAnswerMatchesQuestion(
  question: QuestionRow,
  value: unknown,
  allowedValues: string[],
): void {
  if (isEmpty(value)) return;

  switch (question.type as QuestionType) {
    case "short_text":
    case "long_text":
    case "date":
      if (typeof value !== "string") throw new Error(`${question.title} must be text`);
      return;
    case "email":
      if (typeof value !== "string" || !/^\S+@\S+\.\S+$/.test(value)) {
        throw new Error(`${question.title} must be a valid email`);
      }
      return;
    case "number":
    case "rating":
      if (typeof value !== "number" || Number.isNaN(value)) {
        throw new Error(`${question.title} must be a number`);
      }
      return;
    case "yes_no":
      if (typeof value !== "boolean") throw new Error(`${question.title} must be yes or no`);
      return;
    case "single_choice":
    case "dropdown":
      if (typeof value !== "string") throw new Error(`${question.title} must be one choice`);
      if (allowedValues.length && !allowedValues.includes(value)) {
        throw new Error(`${question.title} contains an invalid choice`);
      }
      return;
    case "multiple_choice":
      if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
        throw new Error(`${question.title} must be multiple choices`);
      }
      if (allowedValues.length && value.some((item) => !allowedValues.includes(item))) {
        throw new Error(`${question.title} contains an invalid choice`);
      }
      return;
    default:
      answerValueSchema.parse(value);
  }
}

function serializeAnswer(
  answer: AnswerRow,
  questionTitle: string | null,
): FormResponse["answers"][number] {
  return {
    id: answer.id,
    responseId: answer.responseId,
    questionId: answer.questionId ?? null,
    questionTitle,
    value: answerValueSchema.parse(answer.value),
    createdAt: toIso(answer.createdAt),
  };
}

class ResponseService {
  public async submit(input: unknown): Promise<SubmitFormOutput> {
    const parsed = submitFormInputSchema.parse(input);

    const [form] = await db
      .select()
      .from(formsTable)
      .where(and(eq(formsTable.slug, parsed.slug), eq(formsTable.status, "published")))
      .limit(1);

    if (!form) throw new Error("Form is not available");

    const settings = normalizeSettings(form.settings);
    if (settings.expiresAt) {
      const expiresAt = Date.parse(settings.expiresAt);
      if (!Number.isNaN(expiresAt) && expiresAt < Date.now()) {
        throw new Error("Form is closed");
      }
    }

    if (settings.responseLimit) {
      const existingResponses = await db
        .select({ id: formResponsesTable.id })
        .from(formResponsesTable)
        .where(eq(formResponsesTable.formId, form.id));

      if (existingResponses.length >= settings.responseLimit) {
        throw new Error("Form has reached its response limit");
      }
    }

    const questions = await db
      .select()
      .from(formQuestionsTable)
      .where(eq(formQuestionsTable.formId, form.id))
      .orderBy(asc(formQuestionsTable.position));

    const questionIds = questions.map((question) => question.id);
    const options = questionIds.length
      ? await db
          .select()
          .from(questionOptionsTable)
          .where(inArray(questionOptionsTable.questionId, questionIds))
      : [];

    const answersByQuestion = new Map(
      parsed.answers.map((answer) => [answer.questionId, answer.value]),
    );

    for (const question of questions) {
      const value = answersByQuestion.get(question.id);
      if (question.required && isEmpty(value)) throw new Error(`${question.title} is required`);

      if (answersByQuestion.has(question.id)) {
        const allowedValues = options
          .filter((option) => option.questionId === question.id)
          .map((option) => option.value);
        assertAnswerMatchesQuestion(question, value, allowedValues);
        assertCustomValidation(question, value);
      }
    }

    const unknownAnswer = parsed.answers.find((answer) => !questionIds.includes(answer.questionId));
    if (unknownAnswer) throw new Error("Submission contains an unknown question");

    const [response] = await db
      .insert(formResponsesTable)
      .values({
        formId: form.id,
        metadata: parsed.metadata ?? {},
      })
      .returning();

    if (!response) throw new Error("Unable to create response");

    const answerRows = parsed.answers
      .filter((answer) => !isEmpty(answer.value))
      .map((answer) => ({
        responseId: response.id,
        questionId: answer.questionId,
        value: answer.value,
      }));

    if (answerRows.length) await db.insert(formAnswersTable).values(answerRows);

    const [creator] = form.ownerId
      ? await db
          .select({ email: usersTable.email })
          .from(usersTable)
          .where(eq(usersTable.id, form.ownerId))
          .limit(1)
      : [];

    void emailService.sendSubmissionNotifications({
      creatorEmail: creator?.email ?? null,
      respondentEmail: findRespondentEmail(objectValue(parsed.metadata), answersByQuestion, questions),
      formId: form.id,
      formTitle: form.title,
      formSlug: form.slug,
      responseId: response.id,
    }).catch((error) => {
      console.error("[email:submission:background:error]", error instanceof Error ? error.message : error);
    });

    return {
      responseId: response.id,
      submittedAt: toIso(response.submittedAt),
    };
  }

  public async listByForm(formId: string): Promise<FormResponse[]> {
    const responses = await db
      .select()
      .from(formResponsesTable)
      .where(eq(formResponsesTable.formId, formId))
      .orderBy(desc(formResponsesTable.submittedAt));

    if (!responses.length) return [];

    const responseIds = responses.map((response) => response.id);
    const answers = await db
      .select()
      .from(formAnswersTable)
      .where(inArray(formAnswersTable.responseId, responseIds));

    const questionIds = [
      ...new Set(answers.flatMap((answer) => (answer.questionId ? [answer.questionId] : []))),
    ];
    const questions = questionIds.length
      ? await db
          .select({ id: formQuestionsTable.id, title: formQuestionsTable.title })
          .from(formQuestionsTable)
          .where(inArray(formQuestionsTable.id, questionIds))
      : [];

    return responses.map((response) => ({
      id: response.id,
      formId: response.formId,
      submittedAt: toIso(response.submittedAt),
      metadata: objectValue(response.metadata),
      answers: answers
        .filter((answer) => answer.responseId === response.id)
        .map((answer) =>
          serializeAnswer(
            answer,
            questions.find((question) => question.id === answer.questionId)?.title ?? null,
          ),
        ),
    }));
  }

  public async getSummary(formId: string): Promise<FormSummary> {
    const questions = await db
      .select()
      .from(formQuestionsTable)
      .where(eq(formQuestionsTable.formId, formId))
      .orderBy(asc(formQuestionsTable.position));

    const responses = await db
      .select({ id: formResponsesTable.id })
      .from(formResponsesTable)
      .where(eq(formResponsesTable.formId, formId));

    const responseIds = responses.map((response) => response.id);
    const answers = responseIds.length
      ? await db
          .select()
          .from(formAnswersTable)
          .where(inArray(formAnswersTable.responseId, responseIds))
      : [];

    return {
      formId,
      totalResponses: responses.length,
      questionCount: questions.length,
      questions: questions.map((question) => {
        const questionAnswers = answers.filter((answer) => answer.questionId === question.id);
        const counts: Record<string, number> = {};

        for (const answer of questionAnswers) {
          const value = answer.value;
          const values = Array.isArray(value) ? value : [value];

          for (const item of values) {
            const key = String(item);
            counts[key] = (counts[key] ?? 0) + 1;
          }
        }

        return {
          questionId: question.id,
          title: question.title,
          type: question.type,
          responseCount: questionAnswers.length,
          counts,
        };
      }),
    };
  }

  public async exportCsv(formId: string): Promise<{ filename: string; csv: string }> {
    const [form] = await db
      .select({ slug: formsTable.slug })
      .from(formsTable)
      .where(eq(formsTable.id, formId))
      .limit(1);

    const questions = await db
      .select({ id: formQuestionsTable.id, title: formQuestionsTable.title })
      .from(formQuestionsTable)
      .where(eq(formQuestionsTable.formId, formId))
      .orderBy(asc(formQuestionsTable.position));

    const responses = await this.listByForm(formId);
    const headers = ["response_id", "submitted_at", ...questions.map((question) => question.title)];
    const rows = responses.map((response) => {
      const answersByQuestion = new Map(
        response.answers.flatMap((answer) =>
          answer.questionId ? [[answer.questionId, answer.value] as const] : [],
        ),
      );

      return [
        response.id,
        response.submittedAt ?? "",
        ...questions.map((question) => answersByQuestion.get(question.id) ?? ""),
      ];
    });

    return {
      filename: `${form?.slug ?? formId}-responses.csv`,
      csv: [headers, ...rows]
        .map((row) => row.map((cell) => csvCell(cell)).join(","))
        .join("\n"),
    };
  }
}

function csvCell(value: unknown): string {
  const text = Array.isArray(value)
    ? value.join("; ")
    : value === null || value === undefined
      ? ""
      : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export default ResponseService;
