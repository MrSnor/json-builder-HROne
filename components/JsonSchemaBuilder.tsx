"use client";
import { Form } from "@/components/ui/form";
import { cn, generateId } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import {
  Controller,
  useFieldArray,
  useForm,
  useFormContext,
} from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { JsonSchemaResult, SchemaField } from "@/components/types";
import { formSchema } from "@/components/schemas";

const getDefaultValueForType = (type: string) => {
  switch (type) {
    case "string":
      return "default_value";
    case "number":
      return 0;
    case "boolean":
      return false;
    case "array":
      return [];
    case "nested":
      return undefined;
    default:
      return "";
  }
};

const createNewField = (type: SchemaField["type"] = "string"): SchemaField => ({
  id: generateId(),
  name: `field_${generateId()}`,
  type,
  defaultValue: getDefaultValueForType(type),
  nested: type === "nested" ? [] : undefined,
});

const generateJsonFromFormData = (fields: SchemaField[]): JsonSchemaResult => {
  if (!fields || fields.length === 0) return {};

  const result: JsonSchemaResult = {};

  fields.forEach((field) => {
    if (!field.name?.trim()) return;

    if (field.type === "nested" && field.nested) {
      result[field.name] = generateJsonFromFormData(field.nested);
    } else {
      result[field.name] = field.defaultValue;
    }
  });

  return result;
};

interface FieldRowProps {
  index: number;
  path?: string;
  nestIndex?: number;
  remove?: (index: number) => void;
  removeNested?: (index: number) => void;
}

function FieldRow({
  index,
  path = "fields",
  nestIndex,
  remove,
  removeNested,
}: FieldRowProps) {
  const { register, control, watch } = useFormContext();

  const fullPath = `${path}.${index}`;
  const type = watch(`${fullPath}.type`);

  const {
    fields: childFields,
    append: appendChild,
    remove: removeChild,
  } = useFieldArray({
    control,
    name: `${fullPath}.fields`,
  });

  const depthColor: Record<number, string> = {
    0: "ring-blue-200",
    1: "ring-blue-400",
    2: "ring-blue-600",
    3: "ring-blue-800",
  };

  return (
    <div
      className={cn(
        "border p-4 rounded-md space-y-2 transition duration-300 ring-0",
        nestIndex !== undefined && "ml-4 hover:ring-1",
        nestIndex !== undefined && depthColor[nestIndex]
      )}
    >
      <div className={cn("flex items-center gap-2 transition")}>
        <Input placeholder="Property name" {...register(`${fullPath}.name`)} />

        <Controller
          control={control}
          name={`${fullPath}.type`}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="string">String</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="boolean">Boolean</SelectItem>
                <SelectItem value="nested">Nested</SelectItem>
              </SelectContent>
            </Select>
          )}
        />

        {/* show delete button for non-nested fields */}
        {remove && !nestIndex && nestIndex !== 0 && (
          <Button
            variant="ghost"
            onClick={() => remove(index)}
            type="button"
            className="text-red-600 hover:text-red-800 cursor-pointer"
          >
            {nestIndex}
            <Trash2 className="h-4 w-4" />
          </Button>
        )}

        {removeNested && nestIndex !== undefined && (
          <Button
            variant="ghost"
            onClick={() => removeNested(index)}
            type="button"
            className="text-red-600 hover:text-red-800 cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* nested children */}
      {type === "nested" && (
        <div className="space-y-2">
          {childFields.map((field, childIndex) => (
            <FieldRow
              key={field.id}
              index={childIndex}
              path={`${fullPath}.fields`}
              nestIndex={index}
              removeNested={removeChild}
            />
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendChild(createNewField())}
            className="cursor-pointer"
          >
            Add Field
          </Button>
        </div>
      )}
    </div>
  );
}

const JsonSchemaBuilder = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    // @ts-expect-error - the schema needs to be refined
    resolver: zodResolver(formSchema),
    defaultValues: {
      fields: [createNewField("string"), createNewField("number")],
    },
  });

  const {
    control,
    watch,
    formState: { errors },
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "fields",
  });

  const watchedData = watch();
  const getJsonSchemaFromFields = (fields: SchemaField[]): JsonSchemaResult => {
    const result: JsonSchemaResult = {};

    for (const field of fields) {
      if (field.type === "nested") {
        result[field.name] = getJsonSchemaFromFields(field.fields || []);
      } else {
        result[field.name] = field.type;
      }
    }

    return result;
  };

  const addField = () => {
    append(createNewField());
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">
          JSON Schema Builder
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* builder section */}
        <Card className="">
          <CardContent className="p-6 flex flex-col space-y-4 h-full">
            <Form {...form}>
              <form className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Schema Builder</h2>
                  <Button onClick={addField} type="button">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Field
                  </Button>
                </div>

                <div className="space-y-4 flex-1 overflow-auto">
                  {fields.length > 0 ? (
                    fields.map((field, index) => (
                      <FieldRow
                        key={field.id}
                        index={index}
                        remove={remove}
                        nestIndex={undefined}
                      />
                    ))
                  ) : (
                    <div className="text-gray-500 italic text-center py-8 px-1 border rounded-md">
                      {`No fields added. Click "Add Field" to start building your schema.`}
                    </div>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* json preview section */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">JSON Preview</h2>
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => {
                  try {
                    navigator.clipboard.writeText(
                      JSON.stringify(
                        getJsonSchemaFromFields(watchedData.fields),
                        null,
                        2
                      )
                    );
                    toast.success("Copied to clipboard");
                  } catch (error) {
                    toast.error("Failed to copy to clipboard");
                    console.error(error);
                  }
                }}
              >
                Copy to Clipboard
              </Button>
            </div>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto max-h-[600px]">
              <pre>
                {JSON.stringify(
                  getJsonSchemaFromFields(watchedData.fields),
                  null,
                  2
                )}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JsonSchemaBuilder;
