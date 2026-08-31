<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useMemeStore } from '../stores/memeStore'
import { getMediaUrl } from '../utils/media'
import { MemeItem } from '../../../shared/types'
import {
  X,
  Sparkles,
  Copy,
  Download,
  Check,
  RotateCw,
  FlipHorizontal,
  Sliders,
  Type,
  Crop,
  Layers,
  Image as ImageIcon,
  FolderPlus,
  RefreshCw
} from 'lucide-vue-next'

const props = defineProps<{
  visible: boolean
  sourceMeme?: MemeItem | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved'): void
}>()

const store = useMemeStore()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const sourceImage = ref<HTMLImageElement | null>(null)
const isLoaded = ref(false)

// Edit Controls
const topText = ref('')
const bottomText = ref('')
const fontSize = ref(36)
const fontColor = ref('#ffffff')
const strokeColor = ref('#000000')
const strokeWidth = ref(4)
const isUppercase = ref(true)
const fontFamily = ref('Impact')

// Image Transformations & Filters
const rotation = ref(0) // 0, 90, 180, 270
const flipH = ref(false)
const brightness = ref(100) // %
const contrast = ref(100) // %
const saturation = ref(100) // %
const grayscale = ref(0) // %
const sepia = ref(0) // %

// Save Dialog controls
const showSaveOptions = ref(false)
const targetFolder = ref('')
const newFileName = ref('')
const newTags = ref<string[]>([])
const newTagInput = ref('')
const isSaving = ref(false)

const fontOptions = [
  { name: 'Impact (Klasyczny)', value: 'Impact, Arial Black, sans-serif' },
  { name: 'Arial (Prosty)', value: 'Arial, sans-serif' },
  { name: 'Montserrat (Nowoczesny)', value: 'Montserrat, sans-serif' },
  { name: 'Comic Sans (Ironiczny)', value: '"Comic Sans MS", cursive, sans-serif' }
]

function resetSettings() {
  topText.value = ''
  bottomText.value = ''
  fontSize.value = 40
  fontColor.value = '#ffffff'
  strokeColor.value = '#000000'
  strokeWidth.value = 4
  isUppercase.value = true
  fontFamily.value = 'Impact, Arial Black, sans-serif'
  rotation.value = 0
  flipH.value = false
  brightness.value = 100
  contrast.value = 100
  saturation.value = 100
  grayscale.value = 0
  sepia.value = 0
}

function deepFry() {
  contrast.value = 240
  saturation.value = 280
  brightness.value = 115
  render()
}

function loadImage(src: string) {
  isLoaded.value = false
  const img = new window.Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    sourceImage.value = img
    isLoaded.value = true
    nextTick(() => {
      render()
    })
  }
  img.src = src
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      resetSettings()
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '_')
      const timeStr = Date.now().toString().slice(-4)
      newFileName.value = `meme_edit_${dateStr}_${timeStr}.png`
      targetFolder.value = store.folders.length > 0 ? store.folders[0].path : ''
      newTags.value = ['generator']

      if (props.sourceMeme && props.sourceMeme.type === 'image') {
        loadImage(getMediaUrl(props.sourceMeme.path))
        if (props.sourceMeme.tags) {
          newTags.value = [...props.sourceMeme.tags, 'custom']
        }
      } else {
        // Default blank canvas
        const blankCanvas = document.createElement('canvas')
        blankCanvas.width = 600
        blankCanvas.height = 600
        const ctx = blankCanvas.getContext('2d')
        if (ctx) {
          ctx.fillStyle = '#1e293b'
          ctx.fillRect(0, 0, 600, 600)
          loadImage(blankCanvas.toDataURL())
        }
      }
    }
  },
  { immediate: true }
)

function render() {
  const canvas = canvasRef.value
  const img = sourceImage.value
  if (!canvas || !img || !isLoaded.value) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Calculate canvas dimensions according to rotation
  const isRotated90 = rotation.value === 90 || rotation.value === 270
  canvas.width = isRotated90 ? img.height : img.width
  canvas.height = isRotated90 ? img.width : img.height

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.save()

  // Apply CSS-like canvas filters
  ctx.filter = `brightness(${brightness.value}%) contrast(${contrast.value}%) saturate(${saturation.value}%) grayscale(${grayscale.value}%) sepia(${sepia.value}%)`

  // Move origin to center for rotation & flip
  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.rotate((rotation.value * Math.PI) / 180)
  if (flipH.value) {
    ctx.scale(-1, 1)
  }

  // Draw base image centered
  ctx.drawImage(img, -img.width / 2, -img.height / 2)
  ctx.restore()

  // Draw Meme Texts
  drawText(ctx, canvas.width, canvas.height)
}

function drawText(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.textAlign = 'center'
  ctx.font = `bold ${fontSize.value}px ${fontFamily.value}`
  ctx.fillStyle = fontColor.value
  ctx.strokeStyle = strokeColor.value
  ctx.lineWidth = strokeWidth.value
  ctx.lineJoin = 'round'

  // Top Text
  if (topText.value.trim()) {
    const text = isUppercase.value ? topText.value.toUpperCase() : topText.value
    const lines = wrapText(ctx, text, width - 40)
    lines.forEach((line, index) => {
      const y = 40 + (index + 1) * fontSize.value
      if (strokeWidth.value > 0) ctx.strokeText(line, width / 2, y)
      ctx.fillText(line, width / 2, y)
    })
  }

  // Bottom Text
  if (bottomText.value.trim()) {
    const text = isUppercase.value ? bottomText.value.toUpperCase() : bottomText.value
    const lines = wrapText(ctx, text, width - 40)
    lines.reverse().forEach((line, index) => {
      const y = height - 25 - index * (fontSize.value * 1.15)
      if (strokeWidth.value > 0) ctx.strokeText(line, width / 2, y)
      ctx.fillText(line, width / 2, y)
    })
  }
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = words[0] || ''

  for (let i = 1; i < words.length; i++) {
    const word = words[i]
    const width = ctx.measureText(currentLine + ' ' + word).width
    if (width < maxWidth) {
      currentLine += ' ' + word
    } else {
      lines.push(currentLine)
      currentLine = word
    }
  }
  if (currentLine) {
    lines.push(currentLine)
  }
  return lines
}

function rotateClockwise() {
  rotation.value = (rotation.value + 90) % 360
  render()
}

function toggleFlip() {
  flipH.value = !flipH.value
  render()
}

function getCanvasDataUrl(): string {
  if (!canvasRef.value) return ''
  return canvasRef.value.toDataURL('image/png')
}

async function copyToClipboard() {
  const dataUrl = getCanvasDataUrl()
  if (!dataUrl || !window.electronAPI || store.folders.length === 0) return

  const res = await store.savePastedMeme({
    folderPath: store.folders[0].path,
    fileName: `meme_clip_${Date.now()}.png`,
    base64Data: dataUrl,
    tags: ['generator']
  })
  if (res) {
    store.showToast('Mem zapisany i skopiowany do schowka! Gotowy do wklejenia.', 'success')
  }
}

async function saveMemeToLibrary() {
  if (!targetFolder.value) {
    store.showToast('Wybierz folder docelowy', 'error')
    return
  }

  const dataUrl = getCanvasDataUrl()
  if (!dataUrl) return

  isSaving.value = true
  const success = await store.savePastedMeme({
    folderPath: targetFolder.value,
    fileName: newFileName.value.trim(),
    base64Data: dataUrl,
    tags: newTags.value,
    description: `Wygenerowano w Meme Studio: ${topText.value} / ${bottomText.value}`
  })
  isSaving.value = false

  if (success) {
    emit('saved')
    emit('close')
  }
}

function addTag(tag: string) {
  const norm = tag.toLowerCase().trim().replace(/^#/, '')
  if (norm && !newTags.value.includes(norm)) {
    newTags.value.push(norm)
  }
  newTagInput.value = ''
}

function removeTag(tag: string) {
  newTags.value = newTags.value.filter(t => t !== tag)
}
</script>

<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
    @click.self="emit('close')"
  >
    <div class="w-full max-w-5xl h-[92vh] bg-dark-800 border border-dark-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
      <!-- Header -->
      <div class="p-4 border-b border-dark-700 flex items-center justify-between bg-dark-900/70">
        <div class="flex items-center gap-2.5">
          <div class="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md">
            <Sparkles class="w-5 h-5" />
          </div>
          <div>
            <h3 class="font-bold text-sm text-dark-100 flex items-center gap-2">
              <span>Meme Studio & Generator</span>
              <span class="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                Live Studio
              </span>
            </h3>
            <p class="text-xs text-dark-400">Dodawaj napisy, filtry, kadruj i generuj memy</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="copyToClipboard"
            class="px-3.5 py-1.5 rounded-xl bg-dark-700 hover:bg-dark-600 text-dark-100 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            title="Kopiuj gotowy obraz do schowka"
          >
            <Copy class="w-4 h-4 text-brand-400" />
            <span>Kopiuj do schowka</span>
          </button>

          <button
            @click="showSaveOptions = true"
            class="px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-brand-600/30 active:scale-95"
          >
            <Check class="w-4 h-4" />
            <span>Zapisz w bibliotece</span>
          </button>

          <button
            @click="emit('close')"
            class="p-1.5 text-dark-400 hover:text-white rounded-lg hover:bg-dark-700 transition-colors ml-2"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Main Workspace -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Left Panel: Controls & Typography -->
        <div class="w-80 border-r border-dark-700/80 bg-dark-900/50 p-4 overflow-y-auto space-y-5 flex flex-col shrink-0">
          <!-- Text Inputs -->
          <div class="space-y-3">
            <span class="text-[11px] font-bold tracking-wider text-dark-400 uppercase flex items-center gap-1.5">
              <Type class="w-3.5 h-3.5 text-brand-400" />
              <span>Napisy Mema</span>
            </span>

            <div class="space-y-2">
              <div>
                <label class="text-[11px] font-medium text-dark-300">Górny tekst (Top):</label>
                <input
                  v-model="topText"
                  @input="render"
                  type="text"
                  placeholder="NP. KIEDY KOD DZIAŁA..."
                  class="w-full mt-1 bg-dark-950 border border-dark-700 rounded-lg px-3 py-2 text-xs text-dark-100 placeholder-dark-600 focus:outline-none focus:border-brand-500 font-bold"
                />
              </div>

              <div>
                <label class="text-[11px] font-medium text-dark-300">Dolny tekst (Bottom):</label>
                <input
                  v-model="bottomText"
                  @input="render"
                  type="text"
                  placeholder="NP. ALE NIE WIESZ DLACZEGO"
                  class="w-full mt-1 bg-dark-950 border border-dark-700 rounded-lg px-3 py-2 text-xs text-dark-100 placeholder-dark-600 focus:outline-none focus:border-brand-500 font-bold"
                />
              </div>
            </div>

            <!-- Font controls -->
            <div class="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label class="text-[10px] text-dark-400">Czcionka:</label>
                <select
                  v-model="fontFamily"
                  @change="render"
                  class="w-full mt-1 bg-dark-950 border border-dark-700 rounded-lg p-1.5 text-xs text-dark-200 focus:outline-none focus:border-brand-500"
                >
                  <option v-for="f in fontOptions" :key="f.name" :value="f.value">
                    {{ f.name }}
                  </option>
                </select>
              </div>

              <div>
                <label class="text-[10px] text-dark-400">Rozmiar: {{ fontSize }}px</label>
                <input
                  v-model.number="fontSize"
                  @input="render"
                  type="range"
                  min="16"
                  max="90"
                  class="w-full mt-2 accent-brand-500"
                />
              </div>
            </div>

            <!-- Colors & Stroke -->
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="text-[10px] text-dark-400">Kolor tekstu:</label>
                <input
                  v-model="fontColor"
                  @input="render"
                  type="color"
                  class="w-full h-8 mt-1 rounded bg-dark-950 border border-dark-700 cursor-pointer p-0.5"
                />
              </div>
              <div>
                <label class="text-[10px] text-dark-400">Kolor obrysu:</label>
                <input
                  v-model="strokeColor"
                  @input="render"
                  type="color"
                  class="w-full h-8 mt-1 rounded bg-dark-950 border border-dark-700 cursor-pointer p-0.5"
                />
              </div>
            </div>
          </div>

          <!-- Transform & Filter Controls -->
          <div class="space-y-3 pt-2 border-t border-dark-700/80">
            <span class="text-[11px] font-bold tracking-wider text-dark-400 uppercase flex items-center gap-1.5">
              <Sliders class="w-3.5 h-3.5 text-brand-400" />
              <span>Efekty & Obrót</span>
            </span>

            <!-- Transform Buttons -->
            <div class="grid grid-cols-3 gap-1.5">
              <button
                @click="rotateClockwise"
                class="py-1.5 px-2 bg-dark-950 hover:bg-dark-800 border border-dark-700 rounded-lg text-xs text-dark-300 hover:text-white flex items-center justify-center gap-1 transition-all"
                title="Obróć o 90 stopni"
              >
                <RotateCw class="w-3.5 h-3.5" />
                <span>90°</span>
              </button>

              <button
                @click="toggleFlip"
                class="py-1.5 px-2 bg-dark-950 hover:bg-dark-800 border border-dark-700 rounded-lg text-xs text-dark-300 hover:text-white flex items-center justify-center gap-1 transition-all"
                title="Odbij w poziomie"
              >
                <FlipHorizontal class="w-3.5 h-3.5" />
                <span>Odbij</span>
              </button>

              <button
                @click="deepFry"
                class="py-1.5 px-2 bg-gradient-to-r from-amber-500/20 to-rose-500/20 hover:from-amber-500/30 hover:to-rose-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-all"
                title="Deep Fry Effect (Maksymalny kontrast i nasycenie)"
              >
                <span>🔥 Fry</span>
              </button>
            </div>

            <!-- Sliders -->
            <div class="space-y-2 text-xs">
              <div>
                <div class="flex justify-between text-[10px] text-dark-400">
                  <span>Kontrast</span>
                  <span>{{ contrast }}%</span>
                </div>
                <input
                  v-model.number="contrast"
                  @input="render"
                  type="range"
                  min="50"
                  max="300"
                  class="w-full accent-brand-500 h-1.5"
                />
              </div>

              <div>
                <div class="flex justify-between text-[10px] text-dark-400">
                  <span>Nasycenie</span>
                  <span>{{ saturation }}%</span>
                </div>
                <input
                  v-model.number="saturation"
                  @input="render"
                  type="range"
                  min="0"
                  max="300"
                  class="w-full accent-brand-500 h-1.5"
                />
              </div>

              <div>
                <div class="flex justify-between text-[10px] text-dark-400">
                  <span>Jasność</span>
                  <span>{{ brightness }}%</span>
                </div>
                <input
                  v-model.number="brightness"
                  @input="render"
                  type="range"
                  min="50"
                  max="200"
                  class="w-full accent-brand-500 h-1.5"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Center: Interactive Canvas Preview Area -->
        <div class="flex-1 bg-dark-950 flex items-center justify-center p-6 overflow-hidden relative select-none">
          <div class="max-w-full max-h-full flex items-center justify-center p-2 rounded-2xl bg-dark-900/40 border border-dark-700/50 shadow-2xl">
            <canvas
              ref="canvasRef"
              class="max-w-full max-h-[70vh] object-contain rounded-xl shadow-lg border border-dark-800"
            ></canvas>
          </div>
        </div>
      </div>
    </div>

    <!-- Save Options Dialog Modal -->
    <Teleport to="body">
      <div
        v-if="showSaveOptions"
        class="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
        @click.self="showSaveOptions = false"
      >
        <div class="w-full max-w-md bg-dark-800 border border-dark-700 rounded-2xl shadow-2xl p-5 space-y-4">
          <div class="flex items-center justify-between border-b border-dark-700 pb-3">
            <h4 class="font-bold text-sm text-dark-100 flex items-center gap-2">
              <FolderPlus class="w-4 h-4 text-brand-400" />
              <span>Zapisz mema w bibliotece</span>
            </h4>
            <button @click="showSaveOptions = false" class="text-dark-400 hover:text-white">
              <X class="w-4 h-4" />
            </button>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label class="font-semibold text-dark-300">Wybierz folder:</label>
              <select
                v-model="targetFolder"
                class="w-full mt-1 bg-dark-900 border border-dark-700 rounded-lg p-2 text-dark-100 font-mono text-xs focus:outline-none focus:border-brand-500"
              >
                <option v-for="f in store.folders" :key="f.path" :value="f.path">
                  {{ f.name }} ({{ f.path }})
                </option>
              </select>
            </div>

            <div>
              <label class="font-semibold text-dark-300">Nazwa pliku:</label>
              <input
                v-model="newFileName"
                type="text"
                class="w-full mt-1 bg-dark-900 border border-dark-700 rounded-lg p-2 text-dark-100 font-mono text-xs focus:outline-none focus:border-brand-500 font-bold"
              />
            </div>

            <div>
              <label class="font-semibold text-dark-300">Tagi:</label>
              <div class="flex flex-wrap gap-1.5 min-h-[30px] p-2 bg-dark-900 border border-dark-700 rounded-lg mt-1">
                <span
                  v-for="t in newTags"
                  :key="t"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-brand-500/15 border border-brand-500/30 text-brand-300"
                >
                  <span>#{{ t }}</span>
                  <button @click="removeTag(t)" class="hover:text-rose-400">
                    <X class="w-3 h-3" />
                  </button>
                </span>
                <input
                  v-model="newTagInput"
                  @keydown.enter.prevent="addTag(newTagInput)"
                  type="text"
                  placeholder="Wpisz tag..."
                  class="flex-1 bg-transparent text-xs text-dark-100 placeholder-dark-500 focus:outline-none min-w-[80px]"
                />
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2 border-t border-dark-700">
            <button
              @click="showSaveOptions = false"
              class="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-dark-300 rounded-xl text-xs font-semibold"
            >
              Anuluj
            </button>
            <button
              @click="saveMemeToLibrary"
              :disabled="isSaving"
              class="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Check class="w-4 h-4" />
              <span>{{ isSaving ? 'Zapisywanie...' : 'Zapisz' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
