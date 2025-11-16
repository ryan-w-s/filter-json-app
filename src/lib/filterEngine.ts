import type {
  JsonValue,
  JsonPrimitive,
  FilterSpec,
  FilterCondition,
  FilterProjection,
  FilterError,
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
  const candidates = collectValuesAtPath(root, cond.path).map(toComparable)
  if (cond.operator === "exists") {
    return candidates.some((v) => v !== undefined)
  }
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

function applyProjection(root: JsonValue, proj: FilterProjection): JsonValue {
  if (!proj.paths.length) return root

  if (proj.mode === "drop") {
    // Support array roots by dropping fields from each element
    if (Array.isArray(root)) {
      return root.map((item) =>
        proj.paths.reduce(
          (current, path) => deleteAtPath(current, path),
          item as JsonValue,
        ),
      )
    }

    return proj.paths.reduce(
      (current, path) => deleteAtPath(current, path),
      root,
    )
  }

  // keep mode: for now, only support simple key selection from array items
  if (Array.isArray(root)) {
    return root.map((item) => {
      const obj: Record<string, JsonValue> = {}
      for (const path of proj.paths) {
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
  for (const path of proj.paths) {
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


