import type { AppRouter } from "@eboto-mo/api";
import { loggerLink } from "@trpc/client";
import { experimental_createTRPCNextAppDirClient } from "@trpc/next/app-dir/client";
import superjson from "superjson";

import { endingLink } from "./shared";

export const api = experimental_createTRPCNextAppDirClient<AppRouter>({
  config() {
    return {
      transformer: superjson,
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === "development" ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),
        endingLink(),
      ],
    };
  },
});

export { type RouterInputs, type RouterOutputs } from "@eboto-mo/api";
