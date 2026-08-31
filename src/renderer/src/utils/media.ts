export function getMediaUrl(filePath: string): string {
  if (!filePath) return ''
  return `media://local/?path=${encodeURIComponent(filePath)}`
}
