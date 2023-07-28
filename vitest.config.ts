import { defineConfig } from "vitest/config";
import GithubActionsReporter from "vitest-github-actions-reporter";

export default defineConfig({
  test: {
    include: ["./src/**/*.test.{ts,tsx}"],
    environment: "happy-dom",
    coverage: {
      reporter: ["json-summary", "json", "text"],
    },
    reporters: process.env["GITHUB_ACTIONS"]
      ? ["default", new GithubActionsReporter()]
      : "default",
  },
});
