export function validName ({ text, accent = true } = {}) {
  const regex = accent ? /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ0-9_-\s]+$/ : /^[a-zA-Z0-9_-\s]+$/
  return regex.test(text)
}
