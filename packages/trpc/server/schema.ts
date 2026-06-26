import { z } from "zod";

export const zodUndefinedModel = z.undefined().describe("undefined");
export const zodEmptyInputModel = z.union([
  z.undefined(),
  z.null(),
  z.object({ json: z.null() }),
]);
export { z };
