import {
  createFormInputSchema,
  deleteFormInputSchema,
  deleteFormOutputSchema,
  formDetailSchema,
  formListItemSchema,
  publishFormInputSchema,
  saveBuilderInputSchema,
  updateFormInputSchema,
  uuidSchema,
} from "@repo/services/forms/model";

import { z } from "../../schema";
import { formService } from "../../services";
import { protectedProcedure, publicProcedure, router } from "../../trpc";

const TAGS = ["Forms"];

export const formsRouter = router({
  list: protectedProcedure
    .input(z.union([z.undefined(), z.null(), z.object({ json: z.null() })]))
    .output(z.array(formListItemSchema))
    .query(async ({ ctx }) => formService.list(ctx.user.id)),

  publicList: publicProcedure
    .input(z.union([z.undefined(), z.null(), z.object({ json: z.null() })]))
    .output(z.array(formListItemSchema))
    .query(async () => formService.listPublic()),

  create: protectedProcedure
    .input(createFormInputSchema)
    .output(formListItemSchema)
    .mutation(async ({ ctx, input }) => formService.create(input, ctx.user.id)),

  byId: protectedProcedure
    .input(z.object({ formId: uuidSchema }))
    .output(formDetailSchema.nullable())
    .query(async ({ ctx, input }) => formService.getById(input.formId, ctx.user.id)),

  publicBySlug: publicProcedure
    .meta({ openapi: { method: "GET", path: "/forms/{slug}", tags: TAGS } })
    .input(z.object({ slug: z.string().min(1).max(160) }))
    .output(formDetailSchema.nullable())
    .query(async ({ input }) => formService.getPublicBySlug(input.slug)),

  update: protectedProcedure
    .input(updateFormInputSchema)
    .output(formListItemSchema)
    .mutation(async ({ ctx, input }) => formService.update(input, ctx.user.id)),

  saveBuilder: protectedProcedure
    .input(saveBuilderInputSchema)
    .output(formDetailSchema)
    .mutation(async ({ ctx, input }) => formService.saveBuilder(input, ctx.user.id)),

  publish: protectedProcedure
    .input(publishFormInputSchema)
    .output(formListItemSchema)
    .mutation(async ({ ctx, input }) => formService.publish(input, ctx.user.id)),

  unpublish: protectedProcedure
    .input(publishFormInputSchema)
    .output(formListItemSchema)
    .mutation(async ({ ctx, input }) => formService.unpublish(input, ctx.user.id)),

  remove: protectedProcedure
    .input(deleteFormInputSchema)
    .output(deleteFormOutputSchema)
    .mutation(async ({ ctx, input }) => formService.remove(input, ctx.user.id)),
});
