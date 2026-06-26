import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { usersTable } from "./user";

export const formStatusEnum = pgEnum("form_status", ["draft", "published"]);
export const formVisibilityEnum = pgEnum("form_visibility", ["public", "unlisted"]);

export const questionTypeEnum = pgEnum("question_type", [
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
]);

type JsonObject = Record<string, unknown>;

export const formsTable = pgTable("forms", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  title: varchar("title", { length: 180 }).notNull(),
  description: text("description"),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  status: formStatusEnum("status").notNull().default("draft"),
  visibility: formVisibilityEnum("visibility").notNull().default("unlisted"),
  theme: jsonb("theme").$type<JsonObject>(),
  settings: jsonb("settings").$type<JsonObject>(),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

export const formQuestionsTable = pgTable("form_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  formId: uuid("form_id")
    .notNull()
    .references(() => formsTable.id, { onDelete: "cascade" }),
  type: questionTypeEnum("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  required: boolean("required").notNull().default(false),
  position: integer("position").notNull(),
  placeholder: varchar("placeholder", { length: 160 }),
  helpText: text("help_text"),
  validation: jsonb("validation").$type<JsonObject>(),
  logic: jsonb("logic").$type<JsonObject>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

export const questionOptionsTable = pgTable("question_options", {
  id: uuid("id").primaryKey().defaultRandom(),
  questionId: uuid("question_id")
    .notNull()
    .references(() => formQuestionsTable.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 140 }).notNull(),
  value: varchar("value", { length: 140 }).notNull(),
  position: integer("position").notNull(),
});

export const formResponsesTable = pgTable("form_responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  formId: uuid("form_id")
    .notNull()
    .references(() => formsTable.id, { onDelete: "cascade" }),
  submittedAt: timestamp("submitted_at").defaultNow(),
  metadata: jsonb("metadata").$type<JsonObject>(),
});

export const formAnswersTable = pgTable("form_answers", {
  id: uuid("id").primaryKey().defaultRandom(),
  responseId: uuid("response_id")
    .notNull()
    .references(() => formResponsesTable.id, { onDelete: "cascade" }),
  questionId: uuid("question_id").references(() => formQuestionsTable.id, {
    onDelete: "set null",
  }),
  value: jsonb("value").$type<unknown>().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type SelectForm = typeof formsTable.$inferSelect;
export type InsertForm = typeof formsTable.$inferInsert;
export type SelectFormQuestion = typeof formQuestionsTable.$inferSelect;
export type InsertFormQuestion = typeof formQuestionsTable.$inferInsert;
export type SelectQuestionOption = typeof questionOptionsTable.$inferSelect;
export type InsertQuestionOption = typeof questionOptionsTable.$inferInsert;
export type SelectFormResponse = typeof formResponsesTable.$inferSelect;
export type InsertFormResponse = typeof formResponsesTable.$inferInsert;
export type SelectFormAnswer = typeof formAnswersTable.$inferSelect;
export type InsertFormAnswer = typeof formAnswersTable.$inferInsert;
