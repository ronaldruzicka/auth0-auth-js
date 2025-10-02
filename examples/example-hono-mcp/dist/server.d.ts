import { Hono } from "hono";
import { Env, Variables } from "./types";
declare const app: Hono<{
    Bindings: Env;
    Variables: Variables;
}, import("hono/types").BlankSchema, "/">;
export default app;
//# sourceMappingURL=server.d.ts.map