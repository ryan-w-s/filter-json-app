import { describe, it, expect } from "vitest"
import { collectValuesAtPath, deleteAtPath, pickAtPath } from "./jsonPath"

describe("jsonPath utilities", () => {
  const sample = {
    user: {
      name: "Alice",
      address: {
        city: "Wonderland",
      },
    },
    items: [
      { id: 1, price: 10 },
      { id: 2, price: 20 },
    ],
  }

  it("collects simple object paths", () => {
    expect(collectValuesAtPath(sample, "user.name")).toEqual(["Alice"])
    expect(collectValuesAtPath(sample, "user.address.city")).toEqual([
      "Wonderland",
    ])
  })

  it("collects array wildcard paths", () => {
    expect(collectValuesAtPath(sample, "items[].price")).toEqual([10, 20])
  })

  it("returns empty array for missing paths", () => {
    expect(collectValuesAtPath(sample, "user.age")).toEqual([])
  })

  it("pickAtPath returns first or array of values", () => {
    expect(pickAtPath(sample, "user.name")).toBe("Alice")
    expect(pickAtPath(sample, "items[].price")).toEqual([10, 20])
    expect(pickAtPath(sample, "missing.path")).toBeUndefined()
  })

  it("deleteAtPath removes fields", () => {
    const withoutName = deleteAtPath(sample, "user.name") as typeof sample
    expect(withoutName.user.name).toBeUndefined()
    expect(withoutName.items.length).toBe(2)
  })
})


