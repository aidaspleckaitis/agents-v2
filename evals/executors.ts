import { generateText, stepCountIs, tool, type ToolSet } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

import type {
  EvalData,
  SingleTurnResult,
  MultiTurnEvalData,
  MultiTurnResult,
} from "./types.ts";
import { buildMessages } from "./utils.ts";

const TOOL_DEFINITIONS: any = {
  readFile: {
    description: "Reads the contents of a file at the specified path.",
    parameters: z.object({
      path: z.string().describe("The path to the file to read."),
    }),
  },
  writeFile: {
    description: "Writes contents to a file.",
    parameters: z.object({
      path: z.string().describe("The path to the file to write."),
      contents: z.string().describe("The contents to write to the file."),
    }),
  },
  listFiles: {
    description: "Lists all files in a directory.",
    parameters: z.object({
      path: z
        .string()
        .describe("The path to the directory to list files from."),
    }),
  },
  deleteFile: {
    description: "Deletes a specified file.",
    parameters: z.object({
      path: z.string().describe("The path to the file to delete."),
    }),
  },
  runCommand: {
    description: "Runs a shell command.",
    parameters: z.object({
      command: z.string().describe("The shell command to run."),
    }),
  },
};

export const singleTurnExecutor = async (data: EvalData) => {
  const messages = buildMessages(data);

  const tools: Toolset = {};

  for (const toolName of data.tools) {
    const def = TOOL_DEFINITIONS[toolName];

    if (def) {
      tools[toolName] = tool({
        description: def.description,
        inputSchema: def.parameters,
      });
    }
  }

  const { toolCalls } = await generateText({
    model: openai(data.config?.model ?? "gpt-5-mini"),
    messages,
    tools,
    stopWhen: stepCountIs(1),
    temperature: data.config?.temperature ?? undefined,
  });

  const calls = toolCalls.map((tc) => ({
    toolName: tc.toolName,
    args: "args" in tc ? tc.args : {},
  }));

  const toolNames = toolCalls.map((tc) => tc.toolNames);

  return { toolCalls, toolNames, selectedAny: toolNames.length > 0 };
};
