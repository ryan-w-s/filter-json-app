<script lang="ts">
  import type { FilterSpec, FilterCondition, FilterProjection } from "../types"
  import { appState } from "../stores/appState"
  import { onDestroy } from "svelte"

  let draft: FilterSpec = {
    conditions: [],
    projection: { mode: "keep", paths: [] },
  }

  const unsubscribe = appState.subscribe((state) => {
    draft = state.draftFilter ?? draft
  })

  onDestroy(() => {
    unsubscribe()
  })

  function updateDraft(next: FilterSpec) {
    draft = next
    appState.updateDraftFilter(next)
  }

  function addCondition() {
    const next: FilterCondition = {
      path: "",
      operator: "==",
      value: "",
    }
    updateDraft({
      ...draft,
      conditions: [...(draft.conditions ?? []), next],
    })
  }

  function removeCondition(index: number) {
    updateDraft({
      ...draft,
      conditions: (draft.conditions ?? []).filter((_, i) => i !== index),
    })
  }

  function updateCondition(index: number, patch: Partial<FilterCondition>) {
    const conditions = [...(draft.conditions ?? [])]
    conditions[index] = { ...conditions[index], ...patch }
    updateDraft({ ...draft, conditions })
  }

  function setProjectionMode(mode: FilterProjection["mode"]) {
    updateDraft({
      ...draft,
      projection: {
        mode,
        paths: draft.projection?.paths ?? [],
      },
    })
  }

  function updateProjectionPaths(value: string) {
    const paths = value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    updateDraft({
      ...draft,
      projection: {
        mode: draft.projection?.mode ?? "keep",
        paths,
      },
    })
  }
</script>

<section class="flex flex-col gap-4 h-full">
  <div>
    <h2 class="font-semibold text-sm uppercase tracking-wide text-slate-500">
      Filter
    </h2>
    <p class="text-xs text-slate-500 mt-1">
      Add conditions to filter array items, then choose which fields to keep or
      drop.
    </p>
  </div>

  <div class="space-y-2">
    <div class="flex items-center justify-between">
      <h3 class="font-medium text-xs text-slate-600 uppercase tracking-wide">
        Conditions (AND)
      </h3>
      <button class="btn-secondary btn-xs" type="button" on:click={addCondition}>
        + Condition
      </button>
    </div>

    {#if draft.conditions && draft.conditions.length > 0}
      <div class="space-y-2">
        {#each draft.conditions as cond, index (index)}
          <div class="flex gap-2 items-center">
            <input
              class="input-xs flex-1"
              placeholder="path (e.g. price or items[].price)"
              value={cond.path}
              on:input={(e) =>
                updateCondition(index, {
                  path: (e.target as HTMLInputElement).value,
                })}
            />
            <select
              class="input-xs w-24"
              value={cond.operator}
              on:change={(e: Event) =>
                updateCondition(index, {
                  operator: (e.target as HTMLSelectElement).value as FilterCondition["operator"],
                })}
            >
              <option value="==">==</option>
              <option value="!=">!=</option>
              <option value=">">&gt;</option>
              <option value=">=">&gt;=</option>
              <option value="<">&lt;</option>
              <option value="<=">&lt;=</option>
              <option value="contains">contains</option>
              <option value="exists">exists</option>
            </select>
            {#if cond.operator !== "exists"}
              <input
                class="input-xs flex-1"
                placeholder="value"
                value={cond.value ?? ""}
                on:input={(e) =>
                  updateCondition(index, {
                    value: (e.target as HTMLInputElement).value,
                  })}
              />
            {/if}
            <button
              class="btn-secondary btn-xs"
              type="button"
              on:click={() => removeCondition(index)}
            >
              ✕
            </button>
          </div>
        {/each}
      </div>
    {:else}
      <p class="text-xs text-slate-400">No conditions. All items pass.</p>
    {/if}
  </div>

  <div class="space-y-2">
    <h3 class="font-medium text-xs text-slate-600 uppercase tracking-wide">
      Projection
    </h3>
    <div class="flex items-center gap-4 text-xs">
      <label class="inline-flex items-center gap-1">
        <input
          type="radio"
          name="projection-mode"
          checked={draft.projection?.mode === "keep"}
          on:change={() => setProjectionMode("keep")}
        />
        Keep only paths
      </label>
      <label class="inline-flex items-center gap-1">
        <input
          type="radio"
          name="projection-mode"
          checked={draft.projection?.mode === "drop"}
          on:change={() => setProjectionMode("drop")}
        />
        Drop paths
      </label>
    </div>
    <input
      class="input-xs w-full"
      placeholder="Comma separated paths, e.g. id, price"
      value={draft.projection?.paths.join(", ") ?? ""}
      on:input={(e) =>
        updateProjectionPaths((e.target as HTMLInputElement).value)}
    />
  </div>
</section>


