<script lang="ts">
  import type { RuleSet } from "../types"
  import { appState } from "../stores/appState"
  import { importRuleSetsFromFile, exportRuleSetsToFile, saveRuleSets } from "../tauriClient"
  import { onDestroy } from "svelte"

  let ruleSets: RuleSet[] = []
  let selectedRuleSetId: string | null = null

  const unsubscribe = appState.subscribe((state) => {
    ruleSets = state.ruleSets
    selectedRuleSetId = state.selectedRuleSetId
  })

  onDestroy(() => {
    unsubscribe()
  })

  function selectRuleSet(id: string) {
    appState.selectRuleSet(id)
  }

  async function importRuleSets() {
    const imported = await importRuleSetsFromFile()
    if (!imported) return
    const merged = [...ruleSets, ...imported]
    await saveRuleSets(merged)
  }

  async function exportRuleSets() {
    await exportRuleSetsToFile(ruleSets)
  }
</script>

<aside class="flex flex-col gap-2 h-full">
  <div class="flex items-center justify-between">
    <h2 class="font-semibold text-sm uppercase tracking-wide text-slate-500">
      Rule Sets
    </h2>
    <div class="flex gap-1">
      <button class="btn-secondary btn-xs" type="button" on:click={importRuleSets}>
        Import
      </button>
      <button class="btn-secondary btn-xs" type="button" on:click={exportRuleSets}>
        Export
      </button>
    </div>
  </div>

  <div class="flex-1 rounded border border-slate-200 bg-white overflow-auto text-xs">
    {#if ruleSets.length === 0}
      <p class="p-2 text-slate-400">No rule sets yet.</p>
    {:else}
      <ul>
        {#each ruleSets as set (set.id)}
          <li>
            <button
              type="button"
              class="w-full text-left px-2 py-1 hover:bg-slate-50 border-b border-slate-100 flex flex-col gap-1"
              class:bg-slate-100={set.id === selectedRuleSetId}
              on:click={() => selectRuleSet(set.id)}
            >
              <span class="font-medium text-slate-700">{set.name}</span>
              {#if set.rules.length > 0}
                <span class="text-[10px] text-slate-500">
                  {set.rules.length} rule{set.rules.length === 1 ? "" : "s"}
                </span>
              {/if}
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</aside>


