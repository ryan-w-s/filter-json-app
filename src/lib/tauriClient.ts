import type { JsonValue, RuleSet } from "./types"

const RULES_STORAGE_KEY = "filter-json-app/rule-sets"

export async function readClipboardJson(): Promise<string> {
  if ("clipboard" in navigator) {
    try {
      const text = await navigator.clipboard.readText()
      return text ?? ""
    } catch {
      return ""
    }
  }
  return ""
}

export async function writeClipboardText(text: string): Promise<void> {
  if ("clipboard" in navigator) {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // ignore clipboard errors
    }
  }
}

export async function openJsonFile(): Promise<string | null> {
  // Prefer modern File System Access API if available
  const anyWindow = window as unknown as {
    showOpenFilePicker?: (
      options?: {
        types?: {
          description?: string
          accept: Record<string, string[]>
        }[]
        multiple?: boolean
      },
    ) => Promise<FileSystemFileHandle[]>
  }

  if (anyWindow.showOpenFilePicker) {
    try {
      const [handle] = await anyWindow.showOpenFilePicker({
        types: [
          {
            description: "JSON Files",
            accept: { "application/json": [".json"] },
          },
        ],
        multiple: false,
      })
      const file = await handle.getFile()
      return await file.text()
    } catch {
      return null
    }
  }

  // Fallback: hidden file input
  return new Promise<string | null>((resolve) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "application/json"
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) {
        resolve(null)
        return
      }
      resolve(await file.text())
    }
    input.click()
  })
}

type SaveFilePickerOptions = {
  suggestedName?: string
  types?: {
    description?: string
    accept: Record<string, string[]>
  }[]
}

type FileSystemWritableFileStreamLike = {
  write(data: string): Promise<void>
  close(): Promise<void>
}

type FileSystemFileHandleLike = {
  createWritable(): Promise<FileSystemWritableFileStreamLike>
}

async function saveTextWithPicker(
  content: string,
  suggestedName: string,
): Promise<boolean> {
  const anyWindow = window as unknown as {
    showSaveFilePicker?: (
      options?: SaveFilePickerOptions,
    ) => Promise<FileSystemFileHandleLike>
  }

  if (!anyWindow.showSaveFilePicker) {
    return false
  }

  try {
    const handle = await anyWindow.showSaveFilePicker({
      suggestedName,
      types: [
        {
          description: "JSON Files",
          accept: { "application/json": [".json"] },
        },
      ],
    })
    const writable = await handle.createWritable()
    await writable.write(content)
    await writable.close()
    return true
  } catch (error) {
    // If the user cancels the dialog, do not fall back to automatic download.
    const domError = error as { name?: string }
    if (domError && domError.name === "AbortError") {
      return true
    }
    return false
  }
}

export async function saveJsonFile(content: string): Promise<void> {
  const savedWithPicker = await saveTextWithPicker(content, "filtered.json")
  if (savedWithPicker) return

  const blob = new Blob([content], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "filtered.json"
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export async function loadRuleSets(): Promise<RuleSet[]> {
  if (typeof localStorage === "undefined") return []
  const raw = localStorage.getItem(RULES_STORAGE_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as RuleSet[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function saveRuleSets(ruleSets: RuleSet[]): Promise<void> {
  if (typeof localStorage === "undefined") return
  const text = JSON.stringify(ruleSets, null, 2)
  localStorage.setItem(RULES_STORAGE_KEY, text)
}

export async function exportRuleSetsToFile(ruleSets: RuleSet[]): Promise<void> {
  const text = JSON.stringify(ruleSets, null, 2)
  const savedWithPicker = await saveTextWithPicker(text, "rule-sets.json")
  if (savedWithPicker) return

  const blob = new Blob([text], {
    type: "application/json",
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "rule-sets.json"
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export async function importRuleSetsFromFile(): Promise<RuleSet[] | null> {
  const text = await openJsonFile()
  if (!text) return null
  try {
    const parsed = JSON.parse(text) as RuleSet[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return null
  }
}

export function safeParseJson(text: string): { value: JsonValue | null; error: string | null } {
  if (!text.trim()) return { value: null, error: null }
  try {
    return { value: JSON.parse(text) as JsonValue, error: null }
  } catch (e) {
    return { value: null, error: (e as Error).message }
  }
}


