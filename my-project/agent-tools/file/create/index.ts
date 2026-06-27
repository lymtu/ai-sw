import { join } from "path";
import { writeFile } from "fs/promises";

import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const createFile = tool(
  ({
    path,
    name,
    content,
  }: {
    path: string;
    name: string;
    content: string;
        }) => {
  const filePath = join(path, name);
    return `create file with name ${name} and content ${content}`;
  },
  {
    name: "createFile",
    description: "Create a file with the given name and content",
    schema: z.object({
      path: z
        .string()
        .describe("The path to the directory where the file should be created"),
      name: z.string().describe("The name of the file to create"),
      content: z.string().decode("The content of the file to create"),
    }),
  },
);
