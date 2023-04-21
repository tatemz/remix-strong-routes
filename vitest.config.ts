import { defineConfig } from "vitest/config";
import GithubActionsReporter from "vitest-github-actions-reporter";

export default defineConfig({
  test: {
    environment: "jsdom",
    coverage: {
      reporter: ["json-summary", "json", "text"],
    },
    reporters: process.env["GITHUB_ACTIONS"]
      ? ["default", new GithubActionsReporter()]
      : "default",
  },
});
