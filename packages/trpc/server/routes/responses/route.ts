import { TRPCError } from "@trpc/server";

import {
  exportResponsesOutputSchema,
  formResponseSchema,
  formSummarySchema,
  SubmitFormInput,
  submitFormInputSchema,
  submitFormOutputSchema,
  uuidSchema,
} from "@repo/services/forms/model";

import type { Context } from "../../context";
import { z } from "../../schema";
import { formService, responseService } from "../../services";
import { protectedProcedure, publicProcedure, router } from "../../trpc";

const submitBuckets = new Map<string, { count: number; resetAt: number }>();
const submitWindowMs = 10 * 60 * 1000;
const submitLimit = 10;
const TAGS = ["Responses"];

function clientIp(ctx: Context): string {
  const forwardedFor = ctx.req.headers["x-forwarded-for"];
  const raw = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : (forwardedFor ?? ctx.req.socket.remoteAddress ?? "unknown");
  return String(raw ?? "unknown")
    .split(",")[0]
    ?.trim() || "unknown";
}

function assertPublicSubmitAllowed(ctx: Context, input: SubmitFormInput) {
  const now = Date.now();
  const key = `${clientIp(ctx)}:${input.slug}`;
  const current = submitBuckets.get(key);

  if (!current || current.resetAt <= now) {
    submitBuckets.set(key, { count: 1, resetAt: now + submitWindowMs });
    return;
  }

  if (current.count >= submitLimit) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Too many submissions. Try again in a few minutes.",
    });
  }

  current.count += 1;
}

function assertNoHoneypot(input: SubmitFormInput) {
  const metadata = input.metadata ?? {};
  const trap = metadata.website ?? metadata.honeypot ?? metadata.companyWebsite;

  if (typeof trap === "string" && trap.trim()) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Submission rejected",
    });
  }
}

export const responsesRouter = router({
  submit: publicProcedure
    .meta({ openapi: { method: "POST", path: "/responses", tags: TAGS } })
    .input(submitFormInputSchema)
    .output(submitFormOutputSchema)
    .mutation(async ({ ctx, input }) => {
      assertNoHoneypot(input);
      assertPublicSubmitAllowed(ctx, input);
      return responseService.submit(input);
    }),

  listByForm: protectedProcedure
    .input(z.object({ formId: uuidSchema }))
    .output(z.array(formResponseSchema))
    .query(async ({ ctx, input }) => {
      await formService.assertOwner(input.formId, ctx.user.id);
      return responseService.listByForm(input.formId);
    }),

  summary: protectedProcedure
    .input(z.object({ formId: uuidSchema }))
    .output(formSummarySchema)
    .query(async ({ ctx, input }) => {
      await formService.assertOwner(input.formId, ctx.user.id);
      return responseService.getSummary(input.formId);
    }),

  exportCsv: protectedProcedure
    .input(z.object({ formId: uuidSchema }))
    .output(exportResponsesOutputSchema)
    .mutation(async ({ ctx, input }) => {
      await formService.assertOwner(input.formId, ctx.user.id);
      return responseService.exportCsv(input.formId);
    }),
});
