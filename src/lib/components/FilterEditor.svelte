<script lang="ts">
  import type {
    FilterSpec,
    FilterCondition,
    FilterProjection,
    ProjectionRule,
  } from "../types"
  import { appState } from "../stores/appState"
  import { onDestroy } from "svelte"

  let draft: FilterSpec = {
    conditions: [],
    projection: { mode: "keep", rules: [] },
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
        rules: draft.projection?.rules ?? [],
      },
    })
  }

  function addProjectionRule() {
    const next: ProjectionRule = { path: "", match: "exact" }
    updateDraft({
      ...draft,
      projection: {
        mode: draft.projection?.mode ?? "keep",
        rules: [...(draft.projection?.rules ?? []), next],
      },
    })
  }

  function updateProjectionRule(index: number, patch: Partial<ProjectionRule>) {
    const rules = [...(draft.projection?.rules ?? [])]
    rules[index] = { ...rules[index], ...patch }
    updateDraft({
      ...draft,
      projection: {
        mode: draft.projection?.mode ?? "keep",
        rules,
      },
    })
  }

  function removeProjectionRule(index: number) {
    updateDraft({
      ...draft,
      projection: {
        mode: draft.projection?.mode ?? "keep",
        rules: (draft.projection?.rules ?? []).filter((_, i) => i !== index),
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
    <div class="space-y-2">
      {#if draft.projection?.rules && draft.projection.rules.length > 0}
        {#each draft.projection.rules as rule, index (index)}
          <div class="flex items-center gap-2">
            <input
              class="input-xs flex-1"
              placeholder="path or key, e.g. company.address.zip"
              value={rule.path}
              on:input={(e) =>
                updateProjectionRule(index, {
                  path: (e.target as HTMLInputElement).value,
                })}
            />
            <select
              class="input-xs w-32"
              value={rule.match ?? "exact"}
              on:change={(e: Event) =>
                updateProjectionRule(index, {
                  match: (e.target as HTMLSelectElement)
                    .value as ProjectionRule["match"],
                })}
            >
              <option value="exact">Exact path</option>
              <option value="keyAnywhere">Key anywhere</option>
            </select>
            <button
              class="btn-secondary btn-xs"
              type="button"
              on:click={() => removeProjectionRule(index)}
            >
              ✕
            </button>
          </div>
        {/each}
      {:else}
        <p class="text-xs text-slate-400">
          No projection rules. All fields are kept.
        </p>
      {/if}
      <button
        class="btn-secondary btn-xs"
        type="button"
        on:click={addProjectionRule}
      >
        + Field
      </button>
    </div>
  </div>
</section>


