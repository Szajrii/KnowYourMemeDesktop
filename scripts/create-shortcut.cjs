const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const targetExe = path.resolve(__dirname, '../release/win-unpacked/Know Your Meme Desktop.exe')
const iconIco = path.resolve(__dirname, '../resources/icon.ico')

const appData = process.env.APPDATA
const userProfile = process.env.USERPROFILE

const possibleDesktopDirs = [
  path.join(userProfile, 'OneDrive/Pulpit'),
  path.join(userProfile, 'OneDrive/Desktop'),
  path.join(userProfile, 'Desktop'),
  path.join(userProfile, 'Pulpit')
]

const targets = [
  path.join(appData, 'Microsoft/Windows/Start Menu/Programs/Know Your Meme Desktop.lnk')
]

for (const dir of possibleDesktopDirs) {
  if (fs.existsSync(dir)) {
    targets.push(path.join(dir, 'Know Your Meme Desktop.lnk'))
  }
}

function createShortcut(destPath) {
  const vbs = `
Set oWS = WScript.CreateObject("WScript.Shell")
sLinkFile = "${destPath.replace(/\\/g, '\\\\')}"
Set oLink = oWS.CreateShortcut(sLinkFile)
oLink.TargetPath = "${targetExe.replace(/\\/g, '\\\\')}"
oLink.WorkingDirectory = "${path.dirname(targetExe).replace(/\\/g, '\\\\')}"
oLink.IconLocation = "${iconIco.replace(/\\/g, '\\\\')},0"
oLink.Description = "Know Your Meme Desktop"
oLink.Save
`
  const vbsPath = path.join(__dirname, 'temp_shortcut.vbs')
  fs.writeFileSync(vbsPath, vbs, 'utf8')
  try {
    execSync(`cscript //nologo "${vbsPath}"`)
    console.log('[shortcut] Created:', destPath)
  } finally {
    if (fs.existsSync(vbsPath)) fs.unlinkSync(vbsPath)
  }
}

if (fs.existsSync(targetExe)) {
  for (const t of targets) {
    createShortcut(t)
  }
} else {
  console.warn('Target exe does not exist yet:', targetExe)
}
