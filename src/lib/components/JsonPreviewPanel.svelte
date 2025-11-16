<script lang="ts">
  import { previewJson } from "../stores/appState"
  import { writeClipboardText, saveJsonFile } from "../tauriClient"
  import { onDestroy } from "svelte"

  let preview: unknown = null
  const unsubscribe = previewJson.subscribe((value) => {
    preview = value
  })

  onDestroy(() => {
    unsubscribe()
  })

  function prettyJson(): string {
    if (preview == null) return ""
    try {
      return JSON.stringify(preview, null, 2)
    } catch {
      return String(preview)
    }
  }

  async function copyToClipboard() {
    await writeClipboardText(prettyJson())
  }

  async function saveToFile() {
    await saveJsonFile(prettyJson())
  }
</script>

<section class="flex flex-col gap-2 h-full">
  <div class="flex items-center justify-between">
    <h2 class="font-semibold text-sm uppercase tracking-wide text-slate-500">
      Filtered JSON
    </h2>
    <div class="flex gap-2">
      <button class="btn-secondary" type="button" on:click={copyToClipboard}>
        Copy
      </button>
      <button class="btn-secondary" type="button" on:click={saveToFile}>
        Save…
      </button>
    </div>
  </div>

  <pre class="flex-1 font-mono text-xs rounded border border-slate-300 bg-white p-2 overflow-auto">
{prettyJson()}
  </pre>
</section>


