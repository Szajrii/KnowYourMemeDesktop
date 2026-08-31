<script setup lang="ts">
import { ref } from 'vue'
import { useMemeStore } from '../stores/memeStore'
import { X, Download, Upload, ShieldCheck, Database, FileJson, CheckCircle } from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'close'): void
}>()

const store = useMemeStore()
const isProcessing = ref(false)

async function handleExport() {
  if (!window.electronAPI) return
  isProcessing.value = true
  try {
    const res = await window.electronAPI.exportBackup()
    if (res.success && res.filePath) {
      store.showToast(`Kopia zapasowa zapisana: ${res.filePath}`, 'success')
      emit('close')
    }
  } catch (e: any) {
    store.showToast(`Błąd eksportu: ${e.message}`, 'error')
  } finally {
    isProcessing.value = false
  }
}

async function handleImport() {
  if (!window.electronAPI) return
  if (!confirm('Czy na pewno chcesz zaimportować kopię zapasową? Istniejące tagi, oceny i metadane zostaną zaktualizowane.')) {
    return
  }

  isProcessing.value = true
  try {
    const res = await window.electronAPI.importBackup()
    if (res.success && res.data) {
      store.setDbData(res.data)
      store.showToast('Kopia zapasowa pomyślnie zaimportowana!', 'success')
      emit('close')
    } else if (res.message) {
      store.showToast(res.message, 'error')
    }
  } catch (e: any) {
    store.showToast(`Błąd importu: ${e.message}`, 'error')
  } finally {
    isProcessing.value = false
  }
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
    @click.self="emit('close')"
  >
    <div class="w-full max-w-lg bg-dark-800 border border-dark-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
      <!-- Header -->
      <div class="p-4 border-b border-dark-700 flex items-center justify-between bg-dark-900/60">
        <div class="flex items-center gap-2.5">
          <div class="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
            <Database class="w-5 h-5" />
          </div>
          <div>
            <h3 class="font-bold text-sm text-dark-100">Kopia Zapasowa & Synchronizacja</h3>
            <p class="text-xs text-dark-400">Eksportuj i importuj tagi, oceny oraz metadane bazy</p>
          </div>
        </div>

        <button
          @click="emit('close')"
          class="p-1.5 text-dark-400 hover:text-white rounded-lg hover:bg-dark-700 transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Body -->
      <div class="p-5 space-y-4 text-xs">
        <div class="grid grid-cols-2 gap-3">
          <!-- Export Card -->
          <div class="p-4 rounded-xl bg-dark-900/80 border border-dark-700 space-y-3 flex flex-col justify-between">
            <div class="space-y-1.5">
              <div class="flex items-center gap-2 text-dark-100 font-bold">
                <Download class="w-4 h-4 text-brand-400" />
                <span>Eksport bazy</span>
              </div>
              <p class="text-[11px] text-dark-400 leading-relaxed">
                Zapisz całą strukturę tagów, kolorów, ocen, liczników użyć i tekstu OCR do pliku JSON.
              </p>
            </div>

            <button
              @click="handleExport"
              :disabled="isProcessing"
              class="w-full py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-brand-600/20 disabled:opacity-50"
            >
              <Download class="w-3.5 h-3.5" />
              <span>Eksportuj JSON</span>
            </button>
          </div>

          <!-- Import Card -->
          <div class="p-4 rounded-xl bg-dark-900/80 border border-dark-700 space-y-3 flex flex-col justify-between">
            <div class="space-y-1.5">
              <div class="flex items-center gap-2 text-dark-100 font-bold">
                <Upload class="w-4 h-4 text-amber-400" />
                <span>Import bazy</span>
              </div>
              <p class="text-[11px] text-dark-400 leading-relaxed">
                Wczytaj plik kopii zapasowej JSON i przywróć konfigurację na nowym komputerze lub po reinstalacji.
              </p>
            </div>

            <button
              @click="handleImport"
              :disabled="isProcessing"
              class="w-full py-2 bg-dark-700 hover:bg-dark-600 text-dark-100 border border-dark-600 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Upload class="w-3.5 h-3.5" />
              <span>Wczytaj JSON</span>
            </button>
          </div>
        </div>

        <div class="p-3 bg-dark-900/50 rounded-xl border border-dark-700/60 flex items-start gap-2.5 text-[11px] text-dark-400">
          <ShieldCheck class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            Twoje pliki graficzne (obrazy/wideo) pozostają nienaruszone w swoich folderach. Kopia zapasowa zawiera indeks tagów, powiązań i ustawień aplikacji.
          </span>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-4 border-t border-dark-700 bg-dark-900/60 flex items-center justify-end">
        <button
          @click="emit('close')"
          class="px-4 py-2 bg-dark-800 hover:bg-dark-700 text-dark-300 rounded-xl text-xs font-semibold transition-colors"
        >
          Zamknij
        </button>
      </div>
    </div>
  </div>
</template>
