import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

export function exportToExcel(data, filename) {
  const ws = XLSX.utils.json_to_sheet(data || [])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  saveAs(new Blob([wbout], { type: 'application/octet-stream' }), filename)
}

export function saveRecentRun(runId, type) {
  if (!runId) return
  const stored = localStorage.getItem('recentRuns')
  const list = stored ? JSON.parse(stored) : []
  list.unshift({ runId, type, at: Date.now() })
  localStorage.setItem('recentRuns', JSON.stringify(list.slice(0, 20)))
}