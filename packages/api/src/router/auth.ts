import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const authRouter = createTRPCRouter({
  getUser: publicProcedure.query(({ ctx }) => {
    return { user: ctx.user };
  }),
  getUserProtected: protectedProcedure.query(({ ctx }) => {
    return { user: ctx.user };
  }),
});
