const { rcedit } = require('rcedit')
const fs = require('fs')
const path = require('path')

async function main() {
  const icoPath = path.resolve(__dirname, '../resources/icon.ico')
  if (!fs.existsSync(icoPath)) {
    console.warn('Icon not found at:', icoPath)
    return
  }

  const targets = [
    path.resolve(__dirname, '../release/win-unpacked/Know Your Meme Desktop.exe'),
    path.resolve(__dirname, '../release/Know Your Meme Desktop 1.0.0.exe')
  ]

  for (const target of targets) {
    if (fs.existsSync(target)) {
      try {
        await rcedit(target, { icon: icoPath })
        console.log(`[set-icon] Injected ${icoPath} into ${path.basename(target)}`)
      } catch (err) {
        console.error(`[set-icon] Failed on ${target}:`, err.message)
      }
    }
  }
}

main()
