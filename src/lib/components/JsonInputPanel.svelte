<script lang="ts">
  import { appState } from "../stores/appState"
  import { readClipboardJson, openJsonFile } from "../tauriClient"
  import { onDestroy } from "svelte"

  let raw = ""
  let parseError: string | null = null

  const unsubscribe = appState.subscribe((state) => {
    raw = state.rawJson
    parseError = state.parseError
  })

  onDestroy(() => {
    unsubscribe()
  })

  async function pasteFromClipboard() {
    const text = await readClipboardJson()
    appState.setRawJson(text)
  }

  async function loadFromFile() {
    const text = await openJsonFile()
    if (text != null) {
      appState.setRawJson(text)
    }
  }

  function onInput(event: Event) {
    const target = event.target as HTMLTextAreaElement
    appState.setRawJson(target.value)
  }
</script>

<section class="flex flex-col gap-2 h-full">
  <div class="flex items-center justify-between">
    <h2 class="font-semibold text-sm uppercase tracking-wide text-slate-500">
      Source JSON
    </h2>
    <div class="flex gap-2">
      <button class="btn-secondary" type="button" on:click={pasteFromClipboard}>
        Paste
      </button>
      <button class="btn-secondary" type="button" on:click={loadFromFile}>
        Open…
      </button>
    </div>
  </div>

  <textarea
    class="flex-1 font-mono text-xs rounded border border-slate-300 bg-slate-50 p-2 resize-none"
    value={raw}
    on:input={onInput}
    spellcheck="false"
  ></textarea>

  {#if parseError}
    <p class="text-xs text-red-600">Parse error: {parseError}</p>
  {/if}
</section>


