import z from "zod";
import { SchemaField } from "@/components/types";

export const schemaFieldSchema: z.ZodType<SchemaField> = z.lazy(() =>
    z.object({
      id: z.string(),
      name: z.string().min(1, "Field name is required"),
      type: z.enum(["string", "number", "boolean", "array", "nested"]),
      defaultValue: z.any().optional(),
      nested: z
        .array(schemaFieldSchema)
        .optional()
        .refine((nested) => !nested || nested.length <= 4, {
          message: "Too many nested fields",
        }),
    })
  );

export const formSchema = z.object({
    fields: z.array(schemaFieldSchema),
  });