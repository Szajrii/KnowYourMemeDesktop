import AdmZip from 'adm-zip'
import path from 'path'
import fs from 'fs-extra'

/**
 * Packs a plugin folder into a .par archive.
 * Usage: node scripts/pack-plugin.js <plugin-folder> [output-path]
 */
async function packPlugin() {
  const args = process.argv.slice(2)
  if (args.length === 0) {
    console.error('Błąd: Podaj ścieżkę do folderu wtyczki!')
    console.error('Użycie: node pack-plugin.js <folder-wtyczki> [ścieżka-wyjściowa.par]')
    process.exit(1)
  }

  const pluginDir = path.resolve(args[0])
  const manifestPath = path.join(pluginDir, 'plugin.json')

  if (!await fs.pathExists(manifestPath)) {
    console.error(`Błąd: Brak pliku plugin.json w ${pluginDir}`)
    process.exit(1)
  }

  const manifest = await fs.readJson(manifestPath)
  if (!manifest.id || !manifest.name || !manifest.entry) {
    console.error('Błąd: plugin.json musi zawierać pola id, name, entry!')
    process.exit(1)
  }

  const outputPath = args[1] 
    ? path.resolve(args[1]) 
    : path.join(pluginDir, `${manifest.id}.par`)

  console.log(`Pakowanie wtyczki "${manifest.name}" (ID: ${manifest.id}, v${manifest.version || '1.0.0'})...`)

  const zip = new AdmZip()

  // Add plugin.json
  zip.addLocalFile(manifestPath)

  // Add icon if exists
  const iconPath = manifest.icon ? path.join(pluginDir, manifest.icon) : path.join(pluginDir, 'icon.png')
  if (await fs.pathExists(iconPath)) {
    zip.addLocalFile(iconPath)
  }

  // Add entry and dist directory
  const distDir = path.join(pluginDir, 'dist')
  if (await fs.pathExists(distDir)) {
    zip.addLocalFolder(distDir, 'dist')
  } else {
    // If entry is not inside dist, check if entry file exists
    const entryPath = path.join(pluginDir, manifest.entry)
    if (!await fs.pathExists(entryPath)) {
      console.warn(`Ostrzeżenie: Plik wejściowy ${manifest.entry} nie istnieje w folderze wtyczki!`)
    }
  }

  // Check optional assets folder
  const assetsDir = path.join(pluginDir, 'assets')
  if (await fs.pathExists(assetsDir)) {
    zip.addLocalFolder(assetsDir, 'assets')
  }

  await fs.ensureDir(path.dirname(outputPath))
  zip.writeZip(outputPath)

  const stat = await fs.stat(outputPath)
  console.log(`✓ Utworzono pakiet .par: ${outputPath} (${(stat.size / 1024).toFixed(1)} KB)`)
}

packPlugin().catch(err => {
  console.error('Błąd pakowania:', err)
  process.exit(1)
})
