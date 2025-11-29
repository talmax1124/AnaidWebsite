import { StackClientApp } from "@stackframe/stack";

export const stackClientApp = new StackClientApp({
  projectId: process.env.REACT_APP_STACK_PROJECT_ID!,
  publishableClientKey: process.env.REACT_APP_STACK_PUBLISHABLE_CLIENT_KEY!,
});