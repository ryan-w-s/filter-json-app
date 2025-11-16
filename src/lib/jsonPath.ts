import type { JsonValue, JsonObject, JsonArray } from "./types"

interface PathSegment {
  key: string | null; // null means operate directly on current (for root arrays)
  wildcard: boolean;
}

function parsePath(path: string): PathSegment[] {
  if (!path) return []
  return path.split(".").map((raw) => {
    if (raw === "[]") {
      return { key: null, wildcard: true }
    }
    if (raw.endsWith("[]")) {
      return { key: raw.slice(0, -2), wildcard: true }
    }
    return { key: raw, wildcard: false }
  })
}

function isObject(value: JsonValue): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isArray(value: JsonValue): value is JsonArray {
  return Array.isArray(value)
}

export function collectValuesAtPath(root: JsonValue, path: string): JsonValue[] {
  const segments = parsePath(path)
  if (!segments.length) return [root]

  const results: JsonValue[] = []

  function traverse(current: JsonValue, idx: number): void {
    if (idx >= segments.length) {
      results.push(current)
      return
    }

    const seg = segments[idx]

    if (seg.key === null) {
      // operate directly on current
      if (seg.wildcard && isArray(current)) {
        for (const item of current) {
          traverse(item, idx + 1)
        }
      }
      return
    }

    if (isObject(current)) {
      const next = (current as JsonObject)[seg.key]
      if (next === undefined) return

      if (seg.wildcard) {
        if (isArray(next)) {
          for (const item of next) {
            traverse(item, idx + 1)
          }
        }
      } else {
        traverse(next, idx + 1)
      }
    } else if (isArray(current) && seg.key === "") {
      // special case: allow "" to mean all items at this level
      if (seg.wildcard) {
        for (const item of current) {
          traverse(item, idx + 1)
        }
      }
    }
  }

  traverse(root, 0)
  return results
}

export function deleteAtPath(root: JsonValue, path: string): JsonValue {
  const segments = parsePath(path)
  if (!segments.length) return root

  function clone(value: JsonValue): JsonValue {
    if (isArray(value)) return value.map(clone) as JsonArray
    if (isObject(value)) {
      const out: JsonObject = {}
      for (const [k, v] of Object.entries(value)) out[k] = clone(v)
      return out
    }
    return value
  }

  function remove(current: JsonValue, idx: number): JsonValue {
    const seg = segments[idx]
    if (!seg) return current

    if (seg.key === null) {
      if (seg.wildcard && isArray(current)) {
        const arr = current as JsonArray
        const nextArr: JsonArray = []
        for (const item of arr) {
          nextArr.push(remove(item, idx + 1))
        }
        return nextArr
      }
      return current
    }

    if (!isObject(current)) return current

    const obj = current as JsonObject
    const cloneObj: JsonObject = { ...obj }

    if (idx === segments.length - 1) {
      // last segment => delete directly or across wildcard array
      if (seg.wildcard) {
        const next = cloneObj[seg.key]
        if (isArray(next)) {
          cloneObj[seg.key] = (next as JsonArray).map((item) =>
            remove(item, idx + 1)
          ) as JsonArray
        }
      } else {
        delete cloneObj[seg.key]
      }
      return cloneObj
    }

    const next = cloneObj[seg.key]
    if (next === undefined) return current

    if (seg.wildcard && isArray(next)) {
      cloneObj[seg.key] = (next as JsonArray).map((item) =>
        remove(item, idx + 1)
      ) as JsonArray
    } else {
      cloneObj[seg.key] = remove(next, idx + 1)
    }

    return cloneObj
  }

  return remove(clone(root), 0)
}

export function pickAtPath(root: JsonValue, path: string): JsonValue | undefined {
  const values = collectValuesAtPath(root, path)
  if (!values.length) return undefined
  if (values.length === 1) return values[0]
  return values as JsonArray
}


