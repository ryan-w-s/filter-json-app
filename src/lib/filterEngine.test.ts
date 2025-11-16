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
        rules: [{ path: "id", match: "exact" }],
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
        rules: [{ path: "price", match: "exact" }],
      },
    }

    const { value } = applyFilterSpec(data, spec)
    expect(value).toEqual([
      { id: 2, category: "b" },
      { id: 3, category: "a" },
    ])
  })

  it("drops nested fields by key anywhere", () => {
    const nested = {
      company: {
        name: "TechCorp",
        headquarters: {
          address: {
            street: "100 Innovation Drive",
            city: "Silicon Valley",
            state: "CA",
            zip: "94043",
          },
        },
        departments: [
          {
            name: "Engineering",
            manager: {
              name: "Alice Johnson",
              zip: "99999",
            },
          },
        ],
      },
    }

    const spec: FilterSpec = {
      projection: {
        mode: "drop",
        rules: [{ path: "zip", match: "keyAnywhere" }],
      },
    }

    const { value } = applyFilterSpec(nested as unknown as unknown[], spec)
    expect(value).toEqual({
      company: {
        name: "TechCorp",
        headquarters: {
          address: {
            street: "100 Innovation Drive",
            city: "Silicon Valley",
            state: "CA",
          },
        },
        departments: [
          {
            name: "Engineering",
            manager: {
              name: "Alice Johnson",
            },
          },
        ],
      },
    })
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

    const { value } = applyFilterSpec(complexData as unknown as { id: number; meta?: unknown }[], spec)
    if (!Array.isArray(value)) {
      throw new Error("Expected array value")
    }
    const ids = (value as { id: number }[]).map((x) => x.id)
    expect(ids).toEqual([1, 3])
  })
})


