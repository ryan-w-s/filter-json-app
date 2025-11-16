import type {
  JsonValue,
  JsonPrimitive,
  FilterSpec,
  FilterCondition,
  FilterProjection,
  FilterError,
  ProjectionRule,
} from "./types"
import { collectValuesAtPath, deleteAtPath } from "./jsonPath"

function toComparable(value: JsonValue): JsonPrimitive | undefined {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null
  ) {
    return value
  }
  return undefined
}

function compareValues(
  left: JsonPrimitive | undefined,
  op: FilterCondition["operator"],
  right: JsonPrimitive | undefined,
): boolean {
  if (op === "exists") {
    return left !== undefined
  }

  if (left === undefined) return false

  switch (op) {
    case "==":
      return left === right
    case "!=":
      return left !== right
    case ">":
      return (left as number | string) > (right as number | string)
    case ">=":
      return (left as number | string) >= (right as number | string)
    case "<":
      return (left as number | string) < (right as number | string)
    case "<=":
      return (left as number | string) <= (right as number | string)
    case "contains":
      if (typeof left === "string" && typeof right === "string") {
        return left.includes(right)
      }
      return false
    default:
      return false
  }
}

function evaluateCondition(root: JsonValue, cond: FilterCondition): boolean {
  const rawValues = collectValuesAtPath(root, cond.path)

  if (cond.operator === "exists") {
    // For existence checks, we care only that some path resolved,
    // regardless of whether the value is primitive, object, or array.
    return rawValues.some((v) => v !== undefined)
  }

  const candidates = rawValues.map(toComparable)
  return candidates.some((v) =>
    compareValues(v, cond.operator, cond.value ?? undefined),
  )
}

function applyConditions(
  root: JsonValue,
  spec: FilterSpec,
): { value: JsonValue; errors: FilterError[] } {
  const errors: FilterError[] = []
  const conditions = spec.conditions ?? []

  if (!conditions.length) return { value: root, errors }

  function filterNode(node: JsonValue): JsonValue {
    if (Array.isArray(node)) {
      return node
        .filter((item) =>
          conditions.every((cond) => {
            try {
              return evaluateCondition(item, cond)
            } catch (e) {
              errors.push({
                kind: "unknown",
                message: String(e),
                path: cond.path,
              })
              return false
            }
          }),
        )
        .map((item) => filterNode(item))
    }
    // For non-array roots, treat conditions as applying directly
    const ok = conditions.every((cond) => {
      try {
        return evaluateCondition(node, cond)
      } catch (e) {
        errors.push({
          kind: "unknown",
          message: String(e),
          path: cond.path,
        })
        return false
      }
    })
    return ok ? node : (null as JsonValue)
  }

  const filtered = filterNode(root)
  return { value: filtered, errors }
}

function normalizeRule(rule: ProjectionRule): ProjectionRule {
  return { match: "exact", ...rule }
}

function deleteByKeyAnywhere(root: JsonValue, key: string): JsonValue {
  function walk(value: JsonValue): JsonValue {
    if (Array.isArray(value)) {
      return value.map(walk)
    }

    if (value !== null && typeof value === "object") {
      const obj = value as Record<string, JsonValue>
      const next: Record<string, JsonValue> = {}
      for (const [k, v] of Object.entries(obj)) {
        if (k === key) continue
        next[k] = walk(v)
      }
      return next
    }

    return value
  }

  return walk(root)
}

function applyProjection(root: JsonValue, proj: FilterProjection): JsonValue {
  const rules = proj.rules?.map(normalizeRule) ?? []
  if (!rules.length) return root

  if (proj.mode === "drop") {
    // Support array roots by dropping fields from each element
    if (Array.isArray(root)) {
      return root.map((item) =>
        rules.reduce(
          (current, rule) =>
            rule.match === "keyAnywhere"
              ? deleteByKeyAnywhere(current, rule.path)
              : deleteAtPath(current, rule.path),
          item as JsonValue,
        ),
      )
    }

    return rules.reduce<JsonValue>(
      (current, rule) =>
        rule.match === "keyAnywhere"
          ? deleteByKeyAnywhere(current, rule.path)
          : deleteAtPath(current, rule.path),
      root,
    )
  }

  // keep mode: for now, only support simple key selection from array items
  if (Array.isArray(root)) {
    return root.map((item) => {
      const obj: Record<string, JsonValue> = {}
      for (const rule of rules) {
        if (rule.match === "keyAnywhere") {
          const values = collectValuesAtPath(item, rule.path)
          if (values.length > 0) {
            obj[rule.path] = values[0]
          }
          continue
        }

        const path = rule.path
        // Only support top-level keys like "id" for MVP
        if (path.includes(".") || path.includes("[]")) continue
        const values = collectValuesAtPath(item, path)
        if (values.length > 0) {
          obj[path] = values[0]
        }
      }
      return obj as JsonValue
    })
  }

  // Non-array root: keep specified top-level keys
  const out: Record<string, JsonValue> = {}
  for (const rule of rules) {
    if (rule.match === "keyAnywhere") {
      const values = collectValuesAtPath(root, rule.path)
      if (values.length > 0) {
        out[rule.path] = values[0]
      }
      continue
    }

    const path = rule.path
    if (path.includes(".") || path.includes("[]")) continue
    const values = collectValuesAtPath(root, path)
    if (values.length > 0) {
      out[path] = values[0]
    }
  }
  return out as JsonValue
}

export function applyFilterSpec(
  json: JsonValue,
  spec: FilterSpec,
): { value: JsonValue; errors: FilterError[] } {
  const { value: conditioned, errors } = applyConditions(json, spec)
  if (spec.projection) {
    return { value: applyProjection(conditioned, spec.projection), errors }
  }
  return { value: conditioned, errors }
}


