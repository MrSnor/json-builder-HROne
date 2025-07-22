
export type DefaultValueType = string | number | boolean | string[] | number[] | null | undefined;

export interface JsonSchemaResult {
  [key: string]: DefaultValueType | JsonSchemaResult;
}

export interface SchemaField {
  id: string;
  name: string;
  type: "string" | "number" | "boolean" | "array" | "nested";
  defaultValue?: DefaultValueType;
  nested?: SchemaField[];
  fields?: SchemaField[];
}

