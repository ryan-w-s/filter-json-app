<script lang="ts">
  import { previewJson } from "../stores/appState"
  import { writeClipboardText, saveJsonFile } from "../tauriClient"

  function prettyJson(value: unknown): string {
    if (value == null) return ""
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return String(value)
    }
  }

  async function copyToClipboard() {
    await writeClipboardText(prettyJson($previewJson))
  }

  async function saveToFile() {
    await saveJsonFile(prettyJson($previewJson))
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

  <pre class="flex-1 font-mono text-xs rounded border border-slate-300 bg-white text-slate-900 p-2 overflow-auto">
{prettyJson($previewJson)}
  </pre>
</section>


