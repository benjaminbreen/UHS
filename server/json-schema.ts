import { z } from "zod";
type Node = Record<string, unknown>;
// OpenAI strict mode demands every property be listed in `required`, so an
// optional field has to travel as a nullable one instead.
const nullable = (node: Node): Node => {
  // An enum lists its own permitted values, so widening the type is not
  // enough: null has to be one of them or strict mode rejects the schema.
  const values = Array.isArray(node.enum)
    ? { enum: [...(node.enum as unknown[]), null] }
    : {};
  const type = node.type;
  if (typeof type === "string" && type !== "null")
    return { ...node, ...values, type: [type, "null"] };
  if (Array.isArray(type) && !type.includes("null"))
    return { ...node, ...values, type: [...type, "null"] };
  return { ...node, ...values };
};
const walk = (node: Node): Node => {
  if (node.type !== "object" || typeof node.properties !== "object")
    return node;
  const properties = node.properties as Record<string, Node>;
  const required = new Set((node.required as string[]) ?? []);
  const rewritten = Object.fromEntries(
    Object.entries(properties).map(([key, value]) => [
      key,
      required.has(key) ? walk(value) : nullable(walk(value)),
    ]),
  );
  return {
    ...node,
    properties: rewritten,
    required: Object.keys(rewritten),
    additionalProperties: false,
  };
};
/** A JSON schema the chat completions `strict` mode will accept. */
export const strictSchema = (schema: z.ZodType): Node => {
  const { $schema: _schema, ...json } = z.toJSONSchema(schema, {
    unrepresentable: "any",
  });
  return walk(json as Node);
};
/** Drops the nulls strict mode forced in, so the zod schema sees absent keys. */
export const dropNulls = <T>(value: T): T => {
  if (Array.isArray(value)) return value.map(dropNulls) as T;
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, v]) => v !== null)
        .map(([k, v]) => [k, dropNulls(v)]),
    ) as T;
  return value;
};
