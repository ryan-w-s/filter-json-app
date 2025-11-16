export type JsonPrimitive = string | number | boolean | null;

export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

export interface JsonObject {
  [key: string]: JsonValue;
}

export type JsonArray = JsonValue[];

// Dot-notation JSON path with optional array wildcard, e.g.:
// "user.name", "items[].price"
export type JsonPath = string;

export type FilterComparisonOperator =
  | "=="
  | "!="
  | ">"
  | ">="
  | "<"
  | "<="
  | "contains"
  | "exists";

export interface FilterCondition {
  /** Dot path to the field to check, e.g. "price" or "items[].price" */
  path: JsonPath;
  operator: FilterComparisonOperator;
  /** Raw JSON value to compare with (string parsed into appropriate type where possible) */
  value?: JsonPrimitive;
}

export type ProjectionMatchMode = "exact" | "keyAnywhere";

export interface ProjectionRule {
  /** Path or key to match against, semantics controlled by `match`. */
  path: JsonPath;
  /** How this rule should be matched. Defaults to `"exact"` when omitted. */
  match?: ProjectionMatchMode;
}

export interface FilterProjection {
  /** If true, fields are kept; if false, fields are dropped. */
  mode: "keep" | "drop";
  /** Rules describing which fields to keep or drop. */
  rules: ProjectionRule[];
}

export interface FilterSpec {
  /** Optional list of conditions combined with logical AND. */
  conditions?: FilterCondition[];
  /** Optional projection to apply after conditions have been evaluated. */
  projection?: FilterProjection;
}

export interface Rule {
  id: string;
  name: string;
  description?: string;
  /** The filter specification this rule applies. */
  spec: FilterSpec;
  /** Whether this rule is currently enabled in its rule set. */
  enabled: boolean;
}

export interface RuleSet {
  id: string;
  name: string;
  description?: string;
  rules: Rule[];
}

export interface FilterError {
  kind: "parse" | "path" | "type" | "operator" | "unknown";
  message: string;
  path?: JsonPath;
}


