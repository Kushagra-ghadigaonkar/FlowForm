import { router } from "./trpc";

import { authRouter } from "./routes/auth/route";
import { formsRouter } from "./routes/forms/route";
import { healthRouter } from "./routes/health/route";
import { responsesRouter } from "./routes/responses/route";

export const serverRouter = router({
  health: healthRouter,
  auth: authRouter,
  forms: formsRouter,
  responses: responsesRouter,
});

export { createContext } from "./context";
export type ServerRouter = typeof serverRouter;
