import { createFileRoute } from "@tanstack/react-router";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import { generateText, Output } from "ai";
import { firecrawl } from "@/lib/firecrawl";
import { auth } from "@clerk/tanstack-react-start/server";

const google = createGoogleGenerativeAI({
  apiKey: process.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY as string,
});

const quickEditedSchema = z.object({
  editedCode: z
    .string()
    .describe(
      "the edited code of the selected version based on the instructions",
    ),
});

const URL_REGEX = /https?:\/\/[^\s)>\]]+/g;
const QUICK_EDIT_PROMPT = `You are a code editing assistant. Edit the selected code based on the user's instruction.

<context>
<selected_code>
{selectedCode}
</selected_code>
<full_code_context>
{fullCode}
</full_code_context>
</context>

{documentation}

<instruction>
{instruction}
</instruction>

<instructions>
Return ONLY the edited version of the selected code.
Maintain the same indentation level as the original.
Do not include any explanations or comments unless requested.
If the instruction is unclear or cannot be applied, return the original code unchanged.
</instructions>`;

export const Route = createFileRoute("/api/quick-edit/")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { userId } = await auth();
          if (!userId)
            return Response.json({ error: "not authorized" }, { status: 403 });
          const { selectedCode, fullCode, instructions } = await request.json();
          if (!selectedCode)
            return Response.json(
              { error: "no code selected" },
              { status: 400 },
            );
          if (!instructions)
            return Response.json(
              { error: "instructions are required" },
              { status: 400 },
            );
          const urls: string[] = instructions.match(URL_REGEX);
          let documentationContext = "";
          if (urls.length > 0) {
            const scrapedResults = await Promise.all(
              urls.map(async (url) => {
                try {
                  const result = await firecrawl.scrape(url, {
                    formats: ["markdown"],
                  });
                  if (result.markdown) {
                    return `<doc url="${url}">\n${result.markdown}\n</doc>`;
                  }
                  return null;
                } catch (err) {
                  return null;
                }
              }),
            );
            const validResults = scrapedResults.filter(Boolean);
            if (validResults.length > 0) {
              documentationContext = `<documentation>\n ${validResults.join("\n\n")} \n</documentation>`;
            }
          }
          const prompt = QUICK_EDIT_PROMPT.replace(
            "{selectedCode}",
            selectedCode,
          )
            .replace("{fullCode}", fullCode || "")
            .replace("{insrtuctions}", instructions)
            .replace("{documentation}", documentationContext);

          const { output } = await generateText({
            model: google("gemini-2.5-flash-lite"),
            output: Output.object({ schema: quickEditedSchema }),
            prompt,
          });
          return Response.json({ editedCode: output.editedCode });
        } catch (err: any) {
          console.log(err);
          Response.json(
            {
              error: err instanceof Error ? err.message : err.message,
            },
            { status: 400 },
          );
        }
      },
    },
  },
});
