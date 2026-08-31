<script setup lang="ts">
import { useMemeStore } from '../stores/memeStore'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-vue-next'

const store = useMemeStore()
</script>

<template>
  <Transition name="scale">
    <div
      v-if="store.toastMessage"
      class="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md transition-all"
      :class="{
        'bg-dark-800/95 border-emerald-500/40 text-emerald-300': store.toastType === 'success',
        'bg-dark-800/95 border-rose-500/40 text-rose-300': store.toastType === 'error',
        'bg-dark-800/95 border-brand-500/40 text-brand-300': store.toastType === 'info'
      }"
    >
      <CheckCircle2 v-if="store.toastType === 'success'" class="w-5 h-5 text-emerald-400 shrink-0" />
      <AlertCircle v-else-if="store.toastType === 'error'" class="w-5 h-5 text-rose-400 shrink-0" />
      <Info v-else class="w-5 h-5 text-brand-400 shrink-0" />
      
      <span class="text-sm font-medium text-dark-100">{{ store.toastMessage }}</span>

      <button
        @click="store.toastMessage = null"
        class="ml-2 text-dark-400 hover:text-dark-200 transition-colors p-0.5 rounded"
      >
        <X class="w-4 h-4" />
      </button>
    </div>
  </Transition>
</template>
