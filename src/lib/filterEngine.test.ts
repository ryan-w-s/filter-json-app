import { describe, it, expect } from "vitest"
import { applyFilterSpec } from "./filterEngine"
import type { FilterSpec } from "./types"

describe("filterEngine", () => {
  const data = [
    { id: 1, price: 5, category: "a" },
    { id: 2, price: 15, category: "b" },
    { id: 3, price: 25, category: "a" },
  ]

  it("filters array items by numeric condition", () => {
    const spec: FilterSpec = {
      conditions: [
        {
          path: "price",
          operator: ">",
          value: 10,
        },
      ],
    }

    const { value, errors } = applyFilterSpec(data, spec)
    expect(errors).toEqual([])
    if (!Array.isArray(value)) {
      throw new Error("Expected array value")
    }
    const ids = (value as { id: number }[]).map((x) => x.id)
    expect(ids).toEqual([2, 3])
  })

  it("filters array items by multiple AND conditions", () => {
    const spec: FilterSpec = {
      conditions: [
        { path: "price", operator: ">", value: 10 },
        { path: "category", operator: "==", value: "a" },
      ],
    }

    const { value } = applyFilterSpec(data, spec)
    if (!Array.isArray(value)) {
      throw new Error("Expected array value")
    }
    const ids = (value as { id: number }[]).map((x) => x.id)
    expect(ids).toEqual([3])
  })

  it("applies projection keep after conditions", () => {
    const spec: FilterSpec = {
      conditions: [{ path: "price", operator: ">", value: 10 }],
      projection: {
        mode: "keep",
        paths: ["id"],
      },
    }

    const { value } = applyFilterSpec(data, spec)
    expect(value).toEqual([{ id: 2 }, { id: 3 }])
  })

  it("applies projection drop after conditions", () => {
    const spec: FilterSpec = {
      conditions: [{ path: "price", operator: ">", value: 10 }],
      projection: {
        mode: "drop",
        paths: ["price"],
      },
    }

    const { value } = applyFilterSpec(data, spec)
    expect(value).toEqual([
      { id: 2, category: "b" },
      { id: 3, category: "a" },
    ])
  })

  it("treats exists operator as true for object/array values", () => {
    const complexData = [
      { id: 1, meta: { nested: true } },
      { id: 2 },
      { id: 3, meta: [] },
    ]

    const spec: FilterSpec = {
      conditions: [{ path: "meta", operator: "exists" }],
    }

    const { value } = applyFilterSpec(complexData as any, spec)
    if (!Array.isArray(value)) {
      throw new Error("Expected array value")
    }
    const ids = (value as { id: number }[]).map((x) => x.id)
    expect(ids).toEqual([1, 3])
  })
})


