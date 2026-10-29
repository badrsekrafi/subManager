export function toCSV(headers, rows) {
  const cell = value => `"${String(value ?? '').replaceAll('"', '""')}"`
  return [headers, ...rows].map(row => row.map(cell).join(',')).join('\r\n')
}

export function downloadCSV(headers, rows, filename) {
  const url = URL.createObjectURL(new Blob(['\uFEFF', toCSV(headers, rows)], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
