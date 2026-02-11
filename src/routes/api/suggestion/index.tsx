import { createFileRoute } from "@tanstack/react-router";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { fetcher } from "@/features/editor/extensions/suggestions/fetcher";
import { SUGGESTION_PROMPT } from "@/constants";
import { auth } from "@clerk/tanstack-react-start/server";

const google = createGoogleGenerativeAI({
  apiKey: process.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY ?? "",
});

const suggestionSchema = z.object({
  suggestion: z
    .string()
    .describe(
      "the code to insert at cursor or empty string if no completion needed",
    ),
});

export const Route = createFileRoute("/api/suggestion/")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const {
            fileName,
            previousLines,
            currentLine,
            textBeforeCursor,
            textAfterCursor,
            nextLines,
            code,
            lineNumber,
          } = await request.json();
          const prompt = SUGGESTION_PROMPT.replace("{fileName}", fileName)
            .replace("{previousLines}", previousLines || "")
            .replace("{currentLine}", currentLine || "")
            .replace("{textBeforeCursor}", textBeforeCursor || "")
            .replace("{textAfterCursor}", textAfterCursor || "")
            .replace("{nextLines}", nextLines || "")
            .replace("{code}", code || "")
            .replace("{lineNumber}", lineNumber.toString());
          const { userId } = await auth();
          if (!userId)
            return Response.json({ error: "not authorized" }, { status: 403 });
          if (!code) {
            return Response.json(
              { error: "Code is Required" },
              { status: 400 },
            );
          }
          const { output } = await generateText({
            model: google("gemini-flash-latest"),
            output: Output.object({ schema: suggestionSchema }),
            prompt,
          });
          return Response.json(
            { suggestion: output?.suggestion },
            { status: 200 },
          );
        } catch (error: any) {
          console.log(
            "suggestion error",
            error instanceof Error ? error.message : error.message,
          );
          return Response.json(
            { error: error instanceof Error ? error.message : error?.message },
            { status: 400 },
          );
        }
      },
    },
  },
});
