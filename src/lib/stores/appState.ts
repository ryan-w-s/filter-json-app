import { writable, derived } from "svelte/store"
import type { JsonValue, RuleSet, Rule, FilterSpec } from "../types"
import { safeParseJson, loadRuleSets, saveRuleSets } from "../tauriClient"
import { applyFilterSpec } from "../filterEngine"

export interface AppState {
  rawJson: string;
  parsedJson: JsonValue | null;
  parseError: string | null;
  ruleSets: RuleSet[];
  selectedRuleSetId: string | null;
  selectedRuleId: string | null;
  draftFilter: FilterSpec | null;
}

const initialState: AppState = {
  rawJson: "",
  parsedJson: null,
  parseError: null,
  ruleSets: [],
  selectedRuleSetId: null,
  selectedRuleId: null,
  draftFilter: null,
}

function createAppState() {
  const store = writable<AppState>(initialState)

  async function initialize() {
    const stored = await loadRuleSets()
    store.update((s) => ({
      ...s,
      ruleSets: stored,
      selectedRuleSetId: stored[0]?.id ?? null,
      selectedRuleId: stored[0]?.rules[0]?.id ?? null,
    }))
  }

  function setRawJson(text: string) {
    const { value, error } = safeParseJson(text)
    store.update((s) => ({
      ...s,
      rawJson: text,
      parsedJson: value,
      parseError: error,
    }))
  }

  function updateDraftFilter(spec: FilterSpec | null) {
    store.update((s) => ({ ...s, draftFilter: spec }))
  }

  async function persistRuleSets(updateFn: (current: RuleSet[]) => RuleSet[]) {
    let next: RuleSet[] = []
    store.update((s) => {
      next = updateFn(s.ruleSets)
      return { ...s, ruleSets: next }
    })
    await saveRuleSets(next)
  }

  function selectRuleSet(id: string | null) {
    store.update((s) => ({
      ...s,
      selectedRuleSetId: id,
      selectedRuleId:
        id == null
          ? null
          : s.ruleSets.find((rs) => rs.id === id)?.rules[0]?.id ?? null,
    }))
  }

  function selectRule(id: string | null) {
    store.update((s) => ({ ...s, selectedRuleId: id }))
  }

  return {
    subscribe: store.subscribe,
    initialize,
    setRawJson,
    updateDraftFilter,
    persistRuleSets,
    selectRuleSet,
    selectRule,
  }
}

export const appState = createAppState()

export const currentRuleSet = derived(
  appState,
  ($state) =>
    $state.ruleSets.find((rs) => rs.id === $state.selectedRuleSetId) ?? null,
)

export const currentRule = derived(currentRuleSet, ($set) => {
  if (!$set) return null
  return $set.rules.find((r) => r.enabled) ?? $set.rules[0] ?? null
})

export const previewJson = derived(appState, ($state) => {
  if (!$state.parsedJson) return null
  const activeRule = $state.draftFilter
    ? ({ id: "draft", name: "Draft", enabled: true, spec: $state.draftFilter } as Rule)
    : null

  const spec = activeRule?.spec
  if (!spec) return $state.parsedJson

  const { value } = applyFilterSpec($state.parsedJson, spec)
  return value
})


