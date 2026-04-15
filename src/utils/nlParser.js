const TEST_TYPE_KEYWORDS = {
  smoke: ['smoke', '冒烟测试', '冒烟'],
  structural: ['structural', '结构测试', '结构'],
  logic: ['logic', '逻辑测试', '逻辑'],
  compare: ['compare', '对比测试', '对比'],
  monitor: ['monitor', '监控测试', '监控']
}

function detectTestTypes(text) {
  const types = []
  Object.keys(TEST_TYPE_KEYWORDS).forEach(type => {
    if (TEST_TYPE_KEYWORDS[type].some(k => text.includes(k))) types.push(type)
  })
  return types.length ? types : ['smoke', 'structural', 'logic', 'compare', 'monitor']
}

function extractBetween(text, startKey, endKey) {
  const start = text.indexOf(startKey)
  if (start === -1) return ''
  const from = start + startKey.length
  if (!endKey) return text.slice(from).trim()
  const end = text.indexOf(endKey, from)
  return end === -1 ? text.slice(from).trim() : text.slice(from, end).trim()
}

function parseResponseJson(text) {
  const idx = text.indexOf('{')
  if (idx === -1) return null
  const jsonText = extractBalancedJson(text.slice(idx))
  try { return JSON.parse(jsonText) } catch (e) { return null }
}

function buildSchema(sample) {
  if (sample === null || sample === undefined) return { type: 'null' }
  if (Array.isArray(sample)) {
    return { type: 'array', items: sample.length ? buildSchema(sample[0]) : {} }
  }
  const t = typeof sample
  if (t === 'string' || t === 'number' || t === 'boolean') return { type: t }
  if (t === 'object') {
    const properties = {}
    Object.keys(sample).forEach(k => { properties[k] = buildSchema(sample[k]) })
    return { type: 'object', properties }
  }
  return { type: 'string' }
}

function parseQueryParams(path) {
  const parts = path.split('?')
  if (parts.length < 2) return {}
  const query = parts[1]
  const params = {}
  query.split('&').forEach(pair => {
    const [k, v] = pair.split('=')
    if (!k) return
    if (!v) {
      params[k] = { type: 'fixed', value: '' }
      return
    }
    if (v.includes('(')) {
      params[k] = { type: 'function', function: v.replace(/\(.*\)$/, ''), args: {} }
      return
    }
    if (v.toUpperCase().startsWith('SELECT')) {
      params[k] = { type: 'db_query', sql: v }
      return
    }
    let decoded = v
    try { decoded = decodeURIComponent(v) } catch (e) { decoded = v }
    params[k] = { type: 'fixed', value: decoded }
  })
  return params
}

function parseAssertions(text, type) {
  const marker = `${type}断言`
  const lines = text.split(/\r?\n|[?;；]/)
  const assertions = []
  lines.forEach(line => {
    if (!line.includes(marker)) return
    const seg = line.split(marker)[1]
    if (!seg) return
    const expr = seg.replace(/[?:]/g, '').trim()
    if (!expr) return
    const match = expr.match(/(.+?)\s*(==|!=|>=|<=|>|<)\s*(.+)$/)
    if (!match) return
    assertions.push({ type: 'path', path: match[1].trim(), operator: match[2], value: match[3].trim() })
  })
  return assertions
}

function extractProject(text) {
  const m1 = text.match(/项目[:：]?\s*([a-zA-Z0-9_-]+)/)
  if (m1) return m1[1]
  const m2 = text.match(/([a-zA-Z0-9_-]+)\s*项目/)
  if (m2) return m2[1]
  return 'demo'
}

function extractPath(text) {
  const m = text.match(/\/[a-zA-Z0-9_/-]+(?:[?][^,\s]+)?/)
  return m ? m[0] : '/'
}

function extractResponseBlock(text) {
  const keys = ['接口请求返回结果', '返回结果', '响应', 'response']
  for (const k of keys) {
    const idx = text.indexOf(k)
    if (idx !== -1) {
      const braceIdx = text.indexOf('{', idx)
      if (braceIdx !== -1) return text.slice(braceIdx)
    }
  }
  const braceIdx = text.indexOf('{')
  return braceIdx !== -1 ? text.slice(braceIdx) : ''
}

function extractBalancedJson(text) {
  let depth = 0
  let end = -1
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '{') depth += 1
    if (ch === '}') {
      depth -= 1
      if (depth === 0) {
        end = i + 1
        break
      }
    }
  }
  return end !== -1 ? text.slice(0, end) : text
}

export function parseNL(text) {
  const methodMatch = text.match(/\b(GET|POST|PUT|DELETE)\b/i)
  const method = methodMatch ? methodMatch[1].toUpperCase() : 'GET'
  const project = extractProject(text)
  const path = extractPath(text)
  const response = parseResponseJson(extractResponseBlock(text))
  const schema = response ? buildSchema(response) : { type: 'object' }
  const testTypes = detectTestTypes(text)
  const params = parseQueryParams(path)

  const interfacePayload = {
    project,
    path: path.split('?')[0],
    method,
    schema,
    description: `${path.split('?')[0]} auto-generated`
  }

  const testcases = testTypes.map(t => {
    const assertions = parseAssertions(text, t)
    const tc = {
      project,
      name: `${path.split('?')[0]}_${t}`,
      api_id: 0,
      test_type: t,
      params,
      enabled: true
    }
    if (assertions.length) tc.assertions = assertions
    return tc
  })

  return { interfacePayload, testcases }
}
