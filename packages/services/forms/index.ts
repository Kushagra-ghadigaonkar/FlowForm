import { randomBytes, randomUUID, scryptSync } from "node:crypto";

import { db, eq, asc, desc, inArray, and } from "@repo/database";
import {
  formAnswersTable,
  formQuestionsTable,
  formResponsesTable,
  formsTable,
  questionOptionsTable,
  usersTable,
} from "@repo/database/schema";

import {
  createFormInputSchema,
  deleteFormInputSchema,
  FormDetail,
  FormListItem,
  FormQuestion,
  FormSettings,
  FormTheme,
  FormVisibility,
  QuestionValidation,
  publishFormInputSchema,
  questionTypes,
  SaveBuilderInput,
  saveBuilderInputSchema,
  updateFormInputSchema,
} from "./model";

export const DEMO_EMAIL = "judge@flowform.io";
const LEGACY_DEMO_EMAIL = "judge@chaiforms.io";
export const DEMO_PASSWORD = "spider-sense-2026";

const DEFAULT_THEME: FormTheme = {
  background: "#fafafa",
  text: "#18181b",
  accent: "#0f766e",
};

const DEFAULT_SETTINGS: FormSettings = {
  showProgress: true,
  collectEmail: false,
};

const DEFAULT_VISIBILITY: FormVisibility = "unlisted";

type FormRow = typeof formsTable.$inferSelect;
type QuestionRow = typeof formQuestionsTable.$inferSelect;
type OptionRow = typeof questionOptionsTable.$inferSelect;

const optionBackedTypes = new Set(["single_choice", "multiple_choice", "dropdown"]);
const publicSeedSlugs = [
  "spider-verse-recruitment",
  "wayne-security-assessment",
  "afterlife-contract",
];
const unlistedSeedSlugs = ["kyoto-sakura-festival", "msdos-retro-survey"];
const seedSlugs = [...publicSeedSlugs, ...unlistedSeedSlugs];

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return new Date(value).toISOString();
}

function objectValue(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function normalizeTheme(value: unknown): FormTheme {
  const object = objectValue(value);
  return {
    background:
      typeof object.background === "string" ? object.background : DEFAULT_THEME.background,
    text: typeof object.text === "string" ? object.text : DEFAULT_THEME.text,
    accent: typeof object.accent === "string" ? object.accent : DEFAULT_THEME.accent,
    preset: typeof object.preset === "string" ? object.preset : undefined,
  };
}

function normalizeSettings(value: unknown): FormSettings {
  const object = objectValue(value);
  const expiresAt = typeof object.expiresAt === "string" ? object.expiresAt : null;
  const responseLimit =
    typeof object.responseLimit === "number" && Number.isInteger(object.responseLimit)
      ? object.responseLimit
      : null;

  return {
    showProgress:
      typeof object.showProgress === "boolean"
        ? object.showProgress
        : DEFAULT_SETTINGS.showProgress,
    collectEmail:
      typeof object.collectEmail === "boolean"
        ? object.collectEmail
        : DEFAULT_SETTINGS.collectEmail,
    expiresAt,
    responseLimit,
  };
}

function normalizeVisibility(value: unknown): FormVisibility {
  return value === "public" || value === "unlisted" ? value : DEFAULT_VISIBILITY;
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
    pattern: typeof object.pattern === "string" ? object.pattern : null,
  };
}

function serializeForm(row: FormRow): FormListItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? null,
    slug: row.slug,
    status: row.status,
    visibility: normalizeVisibility(row.visibility),
    theme: normalizeTheme(row.theme),
    settings: normalizeSettings(row.settings),
    publishedAt: toIso(row.publishedAt),
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function serializeQuestion(row: QuestionRow, options: OptionRow[]): FormQuestion {
  return {
    id: row.id,
    formId: row.formId,
    type: row.type,
    title: row.title,
    description: row.description ?? null,
    required: row.required,
    position: row.position,
    placeholder: row.placeholder ?? null,
    helpText: row.helpText ?? null,
    validation: normalizeValidation(row.validation),
    options: options.map((option) => ({
      id: option.id,
      questionId: option.questionId,
      label: option.label,
      value: option.value,
      position: option.position,
    })),
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 90);
}

async function createUniqueSlug(title: string): Promise<string> {
  const base = slugify(title) || "form";

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const suffix = randomUUID().slice(0, 8);
    const slug = `${base}-${suffix}`;
    const existing = await db
      .select({ id: formsTable.id })
      .from(formsTable)
      .where(eq(formsTable.slug, slug))
      .limit(1);

    if (!existing.length) return slug;
  }

  return `${base}-${Date.now()}`;
}

async function isSlugAvailable(slug: string, formId?: string): Promise<boolean> {
  const [existing] = await db
    .select({ id: formsTable.id })
    .from(formsTable)
    .where(eq(formsTable.slug, slug))
    .limit(1);

  return !existing || existing.id === formId;
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

async function ensureDemoUser(): Promise<string> {
  const [existingUser] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, DEMO_EMAIL))
    .limit(1);

  if (existingUser) return existingUser.id;

  const [legacyUser] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, LEGACY_DEMO_EMAIL))
    .limit(1);

  if (legacyUser) {
    await db
      .update(usersTable)
      .set({ fullName: "FlowForm Judge", email: DEMO_EMAIL })
      .where(eq(usersTable.id, legacyUser.id));
    return legacyUser.id;
  }

  const [user] = await db
    .insert(usersTable)
    .values({
      fullName: "FlowForm Judge",
      email: DEMO_EMAIL,
      emailVerified: true,
      passwordHash: hashPassword(DEMO_PASSWORD),
    })
    .returning({ id: usersTable.id });

  if (!user) throw new Error("Unable to seed demo user");
  return user.id;
}

async function isDemoOwner(ownerId: string): Promise<boolean> {
  const [owner] = await db
    .select({ email: usersTable.email })
    .from(usersTable)
    .where(eq(usersTable.id, ownerId))
    .limit(1);

  return owner?.email === DEMO_EMAIL || owner?.email === LEGACY_DEMO_EMAIL;
}

async function readFormDetail(formId: string, ownerId?: string): Promise<FormDetail | null> {
  const [form] = await db
    .select()
    .from(formsTable)
    .where(
      ownerId
        ? and(eq(formsTable.id, formId), eq(formsTable.ownerId, ownerId))
        : eq(formsTable.id, formId),
    )
    .limit(1);
  if (!form) return null;

  const questions = await db
    .select()
    .from(formQuestionsTable)
    .where(eq(formQuestionsTable.formId, formId))
    .orderBy(asc(formQuestionsTable.position));

  const questionIds = questions.map((question) => question.id);
  const options = questionIds.length
    ? await db
        .select()
        .from(questionOptionsTable)
        .where(inArray(questionOptionsTable.questionId, questionIds))
        .orderBy(asc(questionOptionsTable.position))
    : [];

  return {
    ...serializeForm(form),
    questions: questions.map((question) =>
      serializeQuestion(
        question,
        options.filter((option) => option.questionId === question.id),
      ),
    ),
  };
}

async function autoSeed(requestedOwnerId?: string) {
  const ownerId =
    requestedOwnerId && (await isDemoOwner(requestedOwnerId))
      ? requestedOwnerId
      : await ensureDemoUser();

  await db
    .update(formsTable)
    .set({ ownerId, visibility: "public" })
    .where(inArray(formsTable.slug, publicSeedSlugs));
  await db
    .update(formsTable)
    .set({ ownerId, visibility: "unlisted" })
    .where(inArray(formsTable.slug, unlistedSeedSlugs));

  const count = await db
    .select({ id: formsTable.id })
    .from(formsTable)
    .where(inArray(formsTable.slug, seedSlugs))
    .limit(1);
  if (count.length > 0) return;

  console.log("Empty database detected! Automatically seeding premium themed forms and responses...");

  // Form 1: Spider-Man Recruitment Campaign
  const [spiderForm] = await db.insert(formsTable).values({
    ownerId,
    title: "Spider-Verse Recruitment Initiative",
    description: "Think you have what it takes to join the elite spider-alliance? Take the trial to fire web-shooters and prove your speed.",
    slug: "spider-verse-recruitment",
    status: "published",
    visibility: "public",
    publishedAt: new Date(),
    theme: {
      preset: "spiderman",
      background: "#0c1830",
      text: "#f8fafc",
      accent: "#ef4444"
    },
    settings: {
      showProgress: true,
      collectEmail: false
    }
  }).returning();

  if (spiderForm) {
    const [q1] = await db.insert(formQuestionsTable).values({
      formId: spiderForm.id,
      type: "short_text",
      title: "What is your superhero codename?",
      description: "e.g. Ghost-Spider, Web-Slinger, Silk",
      required: true,
      position: 0
    }).returning();

    const [q2] = await db.insert(formQuestionsTable).values({
      formId: spiderForm.id,
      type: "yes_no",
      title: "Do you have a fully functioning spider sense?",
      description: "Tingly feeling in the back of your skull counts.",
      required: true,
      position: 1
    }).returning();

    const [q3] = await db.insert(formQuestionsTable).values({
      formId: spiderForm.id,
      type: "single_choice",
      title: "Which web-fluid density formula do you fire?",
      description: "Highly vital for swinging speeds.",
      required: true,
      position: 2
    }).returning();

    if (q3) {
      await db.insert(questionOptionsTable).values([
        { questionId: q3.id, label: "Elastic Silk (Fast swinging)", value: "elastic-silk", position: 0 },
        { questionId: q3.id, label: "Concrete Web (Heavy objects)", value: "concrete-web", position: 1 },
        { questionId: q3.id, label: "High Tension Steel (Bridges)", value: "high-tension-steel", position: 2 }
      ]);
    }

    const [q4] = await db.insert(formQuestionsTable).values({
      formId: spiderForm.id,
      type: "rating",
      title: "Rate your overall wall-crawling efficiency",
      required: false,
      position: 3
    }).returning();

    const spiderSubmissions = [
      { alias: "Ghost Spider", sense: true, fluid: "elastic-silk", rate: 5 },
      { alias: "Spider-Punk", sense: true, fluid: "high-tension-steel", rate: 4 },
      { alias: "Spider-Ham", sense: false, fluid: "elastic-silk", rate: 3 },
      { alias: "Peni Parker", sense: true, fluid: "concrete-web", rate: 5 },
      { alias: "Web-Weaver", sense: false, fluid: "high-tension-steel", rate: 4 },
    ];

    for (const sub of spiderSubmissions) {
      const [res] = await db.insert(formResponsesTable).values({
        formId: spiderForm.id,
        metadata: { source: "seed-data" }
      }).returning();
      if (res) {
        if (q1) await db.insert(formAnswersTable).values({ responseId: res.id, questionId: q1.id, value: sub.alias });
        if (q2) await db.insert(formAnswersTable).values({ responseId: res.id, questionId: q2.id, value: sub.sense });
        if (q3) await db.insert(formAnswersTable).values({ responseId: res.id, questionId: q3.id, value: sub.fluid });
        if (q4) await db.insert(formAnswersTable).values({ responseId: res.id, questionId: q4.id, value: sub.rate });
      }
    }
  }

  // Form 2: Gotham Security Assessment
  const [batForm] = await db.insert(formsTable).values({
    ownerId,
    title: "Wayne Enterprises Tactical Survey",
    description: "Evaluate Gotham police response metrics and configure tactical loadouts for street deployment.",
    slug: "wayne-security-assessment",
    status: "published",
    visibility: "public",
    publishedAt: new Date(),
    theme: {
      preset: "batman",
      background: "#09090b",
      text: "#f4f4f5",
      accent: "#eab308"
    },
    settings: {
      showProgress: true,
      collectEmail: false
    }
  }).returning();

  if (batForm) {
    const [bq1] = await db.insert(formQuestionsTable).values({
      formId: batForm.id,
      type: "short_text",
      title: "Identify the primary active threat in your district",
      description: "e.g. Joker toxin, Riddler riddles, Scarecrow gas",
      required: true,
      position: 0
    }).returning();

    const [bq2] = await db.insert(formQuestionsTable).values({
      formId: batForm.id,
      type: "yes_no",
      title: "Should Wayne Enterprises fund the city-wide Bat-Signal?",
      required: true,
      position: 1
    }).returning();

    const [bq3] = await db.insert(formQuestionsTable).values({
      formId: batForm.id,
      type: "single_choice",
      title: "Choose your primary defensive bat-gadget",
      required: true,
      position: 2
    }).returning();

    if (bq3) {
      await db.insert(questionOptionsTable).values([
        { questionId: bq3.id, label: "Batarang (Distance hit)", value: "batarang", position: 0 },
        { questionId: bq3.id, label: "Grapple Hook (Elevation)", value: "grapple-hook", position: 1 },
        { questionId: bq3.id, label: "Explosive Gel (Barriers)", value: "explosive-gel", position: 2 }
      ]);
    }

    const [bq4] = await db.insert(formQuestionsTable).values({
      formId: batForm.id,
      type: "rating",
      title: "Rate the effectiveness of the current Batmobile design",
      required: false,
      position: 3
    }).returning();

    const batSubmissions = [
      { threat: "Riddler Riddles", signal: true, gadget: "batarang", rate: 5 },
      { threat: "Two-Face Henchmen", signal: true, gadget: "grapple-hook", rate: 4 },
      { threat: "Penguin Smugglers", signal: false, gadget: "batarang", rate: 5 },
      { threat: "Scarecrow Gas", signal: true, gadget: "explosive-gel", rate: 3 },
    ];

    for (const sub of batSubmissions) {
      const [res] = await db.insert(formResponsesTable).values({
        formId: batForm.id,
        metadata: { source: "seed-data" }
      }).returning();
      if (res) {
        if (bq1) await db.insert(formAnswersTable).values({ responseId: res.id, questionId: bq1.id, value: sub.threat });
        if (bq2) await db.insert(formAnswersTable).values({ responseId: res.id, questionId: bq2.id, value: sub.signal });
        if (bq3) await db.insert(formAnswersTable).values({ responseId: res.id, questionId: bq3.id, value: sub.gadget });
        if (bq4) await db.insert(formAnswersTable).values({ responseId: res.id, questionId: bq4.id, value: sub.rate });
      }
    }
  }

  // Form 3: Cyberpunk 2077 Night City Contract
  const [cyberForm] = await db.insert(formsTable).values({
    ownerId,
    title: "Afterlife Netrunner Contract",
    description: "Welcome to Night City. Configure your cyberdeck stats, verify neural chip alignment, and take on the heist.",
    slug: "afterlife-contract",
    status: "published",
    visibility: "public",
    publishedAt: new Date(),
    theme: {
      preset: "cyberpunk",
      background: "#0f0f15",
      text: "#facc15",
      accent: "#00f0ff"
    },
    settings: {
      showProgress: true,
      collectEmail: false
    }
  }).returning();

  if (cyberForm) {
    const [cq1] = await db.insert(formQuestionsTable).values({
      formId: cyberForm.id,
      type: "short_text",
      title: "Enter your netrunner alias",
      required: true,
      position: 0
    }).returning();

    const [cq2] = await db.insert(formQuestionsTable).values({
      formId: cyberForm.id,
      type: "yes_no",
      title: "Is your brain equipped with a Militech operating system?",
      required: true,
      position: 1
    }).returning();

    const [cq3] = await db.insert(formQuestionsTable).values({
      formId: cyberForm.id,
      type: "single_choice",
      title: "Select your primary active quickhack",
      required: true,
      position: 2
    }).returning();

    if (cq3) {
      await db.insert(questionOptionsTable).values([
        { questionId: cq3.id, label: "Short Circuit (High EMP damage)", value: "short-circuit", position: 0 },
        { questionId: cq3.id, label: "System Collapse (Stealth takedown)", value: "system-collapse", position: 1 },
        { questionId: cq3.id, label: "Ping (Reveal grid nodes)", value: "ping", position: 2 }
      ]);
    }

    const cyberSubmissions = [
      { alias: "T-Bug", OS: true, hack: "system-collapse" },
      { alias: "Alt_Cunningham", OS: false, hack: "short-circuit" },
      { alias: "Spider_Murphy", OS: true, hack: "ping" },
      { alias: "Lucy_Kushinada", OS: true, hack: "system-collapse" },
    ];

    for (const sub of cyberSubmissions) {
      const [res] = await db.insert(formResponsesTable).values({
        formId: cyberForm.id,
        metadata: { source: "seed-data" }
      }).returning();
      if (res) {
        if (cq1) await db.insert(formAnswersTable).values({ responseId: res.id, questionId: cq1.id, value: sub.alias });
        if (cq2) await db.insert(formAnswersTable).values({ responseId: res.id, questionId: cq2.id, value: sub.OS });
        if (cq3) await db.insert(formAnswersTable).values({ responseId: res.id, questionId: cq3.id, value: sub.hack });
      }
    }
  }

  // Form 4: Sakura Anime Community Quiz
  const [sakuraForm] = await db.insert(formsTable).values({
    ownerId,
    title: "Kyoto Cherry Blossom Festival",
    description: "Welcome to the official cherry blossom anime convention registration. Fill out your details below to secure your pass.",
    slug: "kyoto-sakura-festival",
    status: "published",
    visibility: "unlisted",
    publishedAt: new Date(),
    theme: {
      preset: "sakura",
      background: "#fff5f6",
      text: "#4c0519",
      accent: "#f43f5e"
    },
    settings: {
      showProgress: true,
      collectEmail: false
    }
  }).returning();

  if (sakuraForm) {
    const [sq1] = await db.insert(formQuestionsTable).values({
      formId: sakuraForm.id,
      type: "short_text",
      title: "Name your absolute favorite anime series",
      required: true,
      position: 0
    }).returning();

    const [sq2] = await db.insert(formQuestionsTable).values({
      formId: sakuraForm.id,
      type: "yes_no",
      title: "Will you cosplay at the cherry blossom gardens?",
      required: true,
      position: 1
    }).returning();

    const [sq3] = await db.insert(formQuestionsTable).values({
      formId: sakuraForm.id,
      type: "single_choice",
      title: "Which region of Japan do you want to explore next?",
      required: true,
      position: 2
    }).returning();

    if (sq3) {
      await db.insert(questionOptionsTable).values([
        { questionId: sq3.id, label: "Kyoto (Temples & Tea gardens)", value: "kyoto", position: 0 },
        { questionId: sq3.id, label: "Tokyo (Akihabara electronic town)", value: "tokyo", position: 1 },
        { questionId: sq3.id, label: "Hokkaido (Snow & Hot springs)", value: "hokkaido", position: 2 }
      ]);
    }

    const sakuraSubmissions = [
      { anime: "Your Name", cosplay: true, region: "kyoto" },
      { anime: "Spirited Away", cosplay: false, region: "kyoto" },
      { anime: "Neon Genesis Evangelion", cosplay: true, region: "tokyo" },
      { anime: "Demon Slayer", cosplay: true, region: "hokkaido" },
    ];

    for (const sub of sakuraSubmissions) {
      const [res] = await db.insert(formResponsesTable).values({
        formId: sakuraForm.id,
        metadata: { source: "seed-data" }
      }).returning();
      if (res) {
        if (sq1) await db.insert(formAnswersTable).values({ responseId: res.id, questionId: sq1.id, value: sub.anime });
        if (sq2) await db.insert(formAnswersTable).values({ responseId: res.id, questionId: sq2.id, value: sub.cosplay });
        if (sq3) await db.insert(formAnswersTable).values({ responseId: res.id, questionId: sq3.id, value: sub.region });
      }
    }
  }

  // Form 5: MS-DOS Retro OS Survey
  const [retroForm] = await db.insert(formsTable).values({
    ownerId,
    title: "MS-DOS 6.22 Systems Survey",
    description: "A retro systems questionnaire to assess file allocation tables, memory limits, and prompt setups.",
    slug: "msdos-retro-survey",
    status: "published",
    visibility: "unlisted",
    publishedAt: new Date(),
    theme: {
      preset: "default",
      background: "#000080",
      text: "#ffffff",
      accent: "#00ff00"
    },
    settings: {
      showProgress: true,
      collectEmail: false
    }
  }).returning();

  if (retroForm) {
    const [rq1] = await db.insert(formQuestionsTable).values({
      formId: retroForm.id,
      type: "short_text",
      title: "Type the system command you want to execute",
      description: "e.g. DIR /W, FORMAT C:, MEM /C",
      required: true,
      position: 0
    }).returning();

    const [rq2] = await db.insert(formQuestionsTable).values({
      formId: retroForm.id,
      type: "yes_no",
      title: "System Error: Abort, Retry, Fail?",
      required: true,
      position: 1
    }).returning();

    const retroSubmissions = [
      { cmd: "DIR /W", abort: true },
      { cmd: "FORMAT C:", abort: false },
      { cmd: "MEM /C", abort: true },
    ];

    for (const sub of retroSubmissions) {
      const [res] = await db.insert(formResponsesTable).values({
        formId: retroForm.id,
        metadata: { source: "seed-data" }
      }).returning();
      if (res) {
        if (rq1) await db.insert(formAnswersTable).values({ responseId: res.id, questionId: rq1.id, value: sub.cmd });
        if (rq2) await db.insert(formAnswersTable).values({ responseId: res.id, questionId: rq2.id, value: sub.abort });
      }
    }
  }

  console.log("Seeding complete! Loaded forms, themes, questions, and responses.");
}

class FormService {
  public async list(ownerId: string): Promise<FormListItem[]> {
    await autoSeed(ownerId);
    const rows = await db
      .select()
      .from(formsTable)
      .where(eq(formsTable.ownerId, ownerId))
      .orderBy(desc(formsTable.createdAt));
    return rows.map(serializeForm);
  }

  public async listPublic(): Promise<FormListItem[]> {
    await autoSeed();
    const rows = await db
      .select()
      .from(formsTable)
      .where(and(eq(formsTable.status, "published"), eq(formsTable.visibility, "public")))
      .orderBy(desc(formsTable.createdAt));
    return rows.map(serializeForm);
  }

  public async create(input: unknown, ownerId: string): Promise<FormListItem> {
    const parsed = createFormInputSchema.parse(input);
    const slug = await createUniqueSlug(parsed.title);

    const [form] = await db
      .insert(formsTable)
      .values({
        ownerId,
        title: parsed.title,
        description: parsed.description ?? null,
        slug,
        visibility: parsed.visibility ?? DEFAULT_VISIBILITY,
        theme: normalizeTheme(parsed.theme),
        settings: normalizeSettings(parsed.settings),
      })
      .returning();

    if (!form) throw new Error("Unable to create form");
    return serializeForm(form);
  }

  public async update(input: unknown, ownerId: string): Promise<FormListItem> {
    const parsed = updateFormInputSchema.parse(input);
    const updates: Partial<typeof formsTable.$inferInsert> = {};

    if ("title" in parsed) updates.title = parsed.title;
    if ("description" in parsed) updates.description = parsed.description ?? null;
    if ("slug" in parsed && parsed.slug) {
      const available = await isSlugAvailable(parsed.slug, parsed.id);
      if (!available) throw new Error("Slug is already in use");
      updates.slug = parsed.slug;
    }
    if (parsed.visibility) updates.visibility = parsed.visibility;
    if ("theme" in parsed) updates.theme = normalizeTheme(parsed.theme);
    if ("settings" in parsed) updates.settings = normalizeSettings(parsed.settings);

    const [form] = await db
      .update(formsTable)
      .set(updates)
      .where(and(eq(formsTable.id, parsed.id), eq(formsTable.ownerId, ownerId)))
      .returning();

    if (!form) throw new Error("Form not found");
    return serializeForm(form);
  }

  public async getById(formId: string, ownerId: string): Promise<FormDetail | null> {
    return readFormDetail(formId, ownerId);
  }

  public async getPublicBySlug(slug: string): Promise<FormDetail | null> {
    const [form] = await db
      .select()
      .from(formsTable)
      .where(and(eq(formsTable.slug, slug), eq(formsTable.status, "published")))
      .limit(1);

    if (!form) return null;
    return readFormDetail(form.id);
  }

  public async assertOwner(formId: string, ownerId: string): Promise<void> {
    const [form] = await db
      .select({ id: formsTable.id })
      .from(formsTable)
      .where(and(eq(formsTable.id, formId), eq(formsTable.ownerId, ownerId)))
      .limit(1);

    if (!form) throw new Error("Form not found");
  }

  public async saveBuilder(input: unknown, ownerId: string): Promise<FormDetail> {
    const parsed = saveBuilderInputSchema.parse(input);

    await db.transaction(async (tx) => {
      const [form] = await tx
        .select()
        .from(formsTable)
        .where(and(eq(formsTable.id, parsed.formId), eq(formsTable.ownerId, ownerId)))
        .limit(1);

      if (!form) throw new Error("Form not found");

      await tx
        .update(formsTable)
        .set({
          title: parsed.title,
          description: parsed.description ?? null,
          visibility: parsed.visibility ?? normalizeVisibility(form.visibility),
          theme: normalizeTheme(parsed.theme ?? form.theme),
          settings: normalizeSettings(parsed.settings ?? form.settings),
        })
        .where(and(eq(formsTable.id, parsed.formId), eq(formsTable.ownerId, ownerId)));

      const existingQuestions = await tx
        .select({ id: formQuestionsTable.id })
        .from(formQuestionsTable)
        .where(eq(formQuestionsTable.formId, parsed.formId));

      const existingIds = new Set(existingQuestions.map((question) => question.id));
      const retainedIds = new Set(
        parsed.questions.flatMap((question) => (question.id ? [question.id] : [])),
      );
      const deleteIds = existingQuestions
        .map((question) => question.id)
        .filter((id) => !retainedIds.has(id));

      if (deleteIds.length) {
        await tx.delete(formQuestionsTable).where(inArray(formQuestionsTable.id, deleteIds));
      }

      for (const [index, question] of parsed.questions.entries()) {
        const position = question.position ?? index;
        const questionValues = {
          type: question.type,
          title: question.title,
          description: question.description ?? null,
          required: question.required ?? false,
          position,
          placeholder: question.placeholder ?? null,
          helpText: question.helpText ?? null,
          validation: normalizeValidation(question.validation),
        };

        let questionId = question.id;

        if (questionId && existingIds.has(questionId)) {
          await tx
            .update(formQuestionsTable)
            .set(questionValues)
            .where(eq(formQuestionsTable.id, questionId));
        } else {
          const [createdQuestion] = await tx
            .insert(formQuestionsTable)
            .values({
              ...questionValues,
              formId: parsed.formId,
            })
            .returning();
          if (!createdQuestion) throw new Error("Unable to create question");
          questionId = createdQuestion.id;
        }

        await tx
          .delete(questionOptionsTable)
          .where(eq(questionOptionsTable.questionId, questionId));

        if (optionBackedTypes.has(question.type) && question.options?.length) {
          await tx.insert(questionOptionsTable).values(
            question.options.map((option, optionIndex) => ({
              questionId,
              label: option.label,
              value: option.value,
              position: option.position ?? optionIndex,
            })),
          );
        }
      }
    });

    const form = await readFormDetail(parsed.formId, ownerId);
    if (!form) throw new Error("Form not found after save");
    return form;
  }

  public async publish(input: unknown, ownerId: string): Promise<FormListItem> {
    const parsed = publishFormInputSchema.parse(input);
    const form = await readFormDetail(parsed.formId, ownerId);

    if (!form) throw new Error("Form not found");
    if (!form.questions.length) throw new Error("Add at least one question before publishing");

    const [updatedForm] = await db
      .update(formsTable)
      .set({
        status: "published",
        publishedAt: new Date(),
      })
      .where(and(eq(formsTable.id, parsed.formId), eq(formsTable.ownerId, ownerId)))
      .returning();

    if (!updatedForm) throw new Error("Form not found");
    return serializeForm(updatedForm);
  }

  public async unpublish(input: unknown, ownerId: string): Promise<FormListItem> {
    const parsed = publishFormInputSchema.parse(input);
    const [updatedForm] = await db
      .update(formsTable)
      .set({ status: "draft" })
      .where(and(eq(formsTable.id, parsed.formId), eq(formsTable.ownerId, ownerId)))
      .returning();

    if (!updatedForm) throw new Error("Form not found");
    return serializeForm(updatedForm);
  }

  public async remove(input: unknown, ownerId: string): Promise<{ success: boolean }> {
    const parsed = deleteFormInputSchema.parse(input);
    const [deletedForm] = await db
      .delete(formsTable)
      .where(and(eq(formsTable.id, parsed.formId), eq(formsTable.ownerId, ownerId)))
      .returning({ id: formsTable.id });

    if (!deletedForm) throw new Error("Form not found");
    return { success: true };
  }

  public supportsOptions(type: SaveBuilderInput["questions"][number]["type"]): boolean {
    return optionBackedTypes.has(type) && questionTypes.includes(type);
  }
}

export default FormService;
