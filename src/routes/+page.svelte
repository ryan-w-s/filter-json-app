<script lang="ts">
  import JsonInputPanel from "../lib/components/JsonInputPanel.svelte"
  import JsonPreviewPanel from "../lib/components/JsonPreviewPanel.svelte"
  import FilterEditor from "../lib/components/FilterEditor.svelte"
</script>

<main class="h-screen bg-slate-100 text-slate-900">
  <div class="h-full max-w-6xl mx-auto px-4 py-3 flex flex-col gap-3">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-lg font-semibold tracking-tight">
          JSON Filter
        </h1>
        <p class="text-xs text-slate-500">
          Paste or open JSON, define filters, and copy or save the filtered result.
        </p>
      </div>
    </header>

    <section class="flex-1 grid grid-cols-[1.1fr_1.2fr_1.1fr] gap-3 min-h-0">
      <JsonInputPanel />
      <FilterEditor />
      <JsonPreviewPanel />
    </section>
  </div>
</main>
