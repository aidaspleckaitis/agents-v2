import { evaluate } from "@lmnr-ai/lmnr";
// Test cases containing prompts, available tools, and expected tool selections
import dataset from "./data/file-tools.json" with { type: "json" };
import { singleTurnExecutorWithMocks } from "./executors.ts";
import type { EvalData } from "./types.ts";
import { toolSelectionScore } from "./evaluators.ts";

// Runs a single-turn LLM call with mocked file tool schemas and returns the selected tool calls
const executor = async (data: EvalData) => {
  return singleTurnExecutorWithMocks(data);
};

// Executes the evaluation suite in Laminar across all dataset items
evaluate({
  data: dataset as any,
  executor,
  evaluators: {
    // Scores how accurately the model selected the expected tools (F1 score between 0 and 1)
    selectionScore: (output: any, target: any) => {
      // Secondary/ambiguous prompts pass automatically here (or are scored separately)
      if (target?.category === "secondary") return 1;

      return toolSelectionScore(output, target);
    },
  },
  // Groups these evaluation runs under "file-tools-selection" in the Laminar dashboard
  groupName: "file-tools-selection",
});
