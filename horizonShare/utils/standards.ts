interface INormalizeName {
  name: string
  type: 'camelCase' | 'snakeCase' | 'kebabCase' | 'pascalCase'
}

/**
 * Normalizes the given name based on the specified type.
 *
 * @param name - The name to be normalized.
 * @param type - The type of normalization to be applied. Defaults to 'camelCase'.
 */
export const normalizeName = ({ name, type = 'camelCase' }: INormalizeName) => {
  // Replace double spaces with single space
  name = name.replace(/ {2,}/g, ' ').trim()

  let tempName = ''
  if (type === 'camelCase') {
    name.split(' ').forEach((word: any, index: number) => {
      if (index === 0) {
        tempName = word.charAt(0).toLowerCase() + word.slice(1)
        return
      }
      tempName += word.charAt(0).toUpperCase() + word.slice(1)
    })
  } else if (type === 'snakeCase') {
    name.split(' ').forEach((word: any, index: number) => {
      if (index === 0) {
        tempName = word.toLowerCase()
        return
      }
      tempName += '_' + word.toLowerCase()
    })
  } else if (type === 'kebabCase') {
    name.split(' ').forEach((word: any, index: number) => {
      if (index === 0) {
        tempName = word.toLowerCase()
        return
      }
      tempName += '-' + word.toLowerCase()
    })
  } else if (type === 'pascalCase') {
    name.split(' ').forEach((word: any, index: number) => {
      if (index === 0) {
        tempName = word.charAt(0).toUpperCase() + word.slice(1)
        return
      }
      tempName += word.charAt(0).toUpperCase() + word.slice(1)
    })
  }
  return tempName
}

/**
 * Validates a name.
 *
 * @param text - The name to be validated.
 * @param accent - Whether to allow accented characters. Defaults to true.
 */
export const validName = ({ text, accent = true }:{ text: string, accent?: boolean }) => {
  const regex = accent ? /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ0-9_-\s]+$/ : /^[a-zA-Z0-9_-\s]+$/
  return regex.test(text)
}
