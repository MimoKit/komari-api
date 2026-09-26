'use strict'

/**
 * Komari 开放 API（komari-plugin-api）
 *
 * 把控制台里看得到的节点状态暴露成规范的 REST 接口：
 *   GET /api/v1                          接口索引
 *   GET /api/v1/overview                 站点概览 + 全部节点实时状态
 *   GET /api/v1/nodes                    节点列表
 *   GET /api/v1/nodes/:uuid              节点详情
 *   GET /api/v1/nodes/:uuid/records      历史负载记录
 *   GET /api/v1/ping/tasks               Ping 任务列表
 *   GET /api/v1/ping/records             Ping 记录
 *
 * 数据全部来自面板自身 RPC，不做任何额外存储；
 * 字段可见性随调用者身份自动收敛：匿名 = 访客视角，令牌/管理员 = 完整视角。
 * 敏感字段（agent token 等）一律白名单剔除，永远不会出现在响应里。
 */

const server = require('server')

const PLUGIN_VERSION = '1.0.0'
const DOCS_URL = 'https://github.com/MimoKit/komari-api#readme'

const ENDPOINTS = [
  { method: 'GET', path: '/api/v1', description: '接口索引与版本信息' },
  { method: 'GET', path: '/api/v1/overview', description: '站点信息 + 汇总统计 + 全部节点（含实时状态），一次请求渲染整张卡片' },
  { method: 'GET', path: '/api/v1/nodes', description: '节点列表，支持 ?group= 过滤、?live=false 关闭实时数据' },
  { method: 'GET', path: '/api/v1/nodes/{uuid}', description: '单个节点详情：静态信息 + 实时状态 + Ping 概览' },
  { method: 'GET', path: '/api/v1/nodes/{uuid}/records', description: '历史负载记录，?hours=4&load_type=all' },
  { method: 'GET', path: '/api/v1/ping/tasks', description: 'Ping 任务列表' },
  { method: 'GET', path: '/api/v1/ping/records', description: 'Ping 记录，?uuid= 或 ?task_id= 至少一个，?hours= 默认 1' },
]

const ROUTE_PATHS = [
  '/api/v1',
  '/api/v1/overview',
  '/api/v1/nodes',
  '/api/v1/nodes/:uuid',
  '/api/v1/nodes/:uuid/records',
  '/api/v1/ping/tasks',
  '/api/v1/ping/records',
]

/* --------------------------------- 工具 --------------------------------- */

function json(res, status, data) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.statusCode = status
  res.end(JSON.stringify(data))
}

function fail(res, status, code, message) {
  json(res, status, { error: { code: code, message: message } })
}

function decodeSafe(s) {
  try { return decodeURIComponent(s) } catch (e) { return s }
}

function splitPath(url) {
  const q = url.indexOf('?')
  const raw = (q === -1 ? url : url.slice(0, q))
  const path = raw.length > 1 ? raw.replace(/\/+$/, '') : raw
  const segments = path.split('/').filter(Boolean).map(decodeSafe)
  return segments
}

function queryInt(v, def, min, max) {
  const n = parseInt(v, 10)
  if (!isFinite(n)) return def
  if (min !== undefined && n < min) return min
  if (max !== undefined && n > max) return max
  return n
}

function tagList(s) {
  return String(s || '').split(';').map(function (t) { return t.trim() }).filter(Boolean)
}

/* --------------------------------- 鉴权 --------------------------------- */

const cfgCache = { tokens: null, allowCors: true, at: 0 }

async function loadConfig() {
  const now = Date.now()
  if (cfgCache.tokens !== null && now - cfgCache.at < 5000) return cfgCache
  try {
    const cfg = await server.getConfig()
    const raw = String((cfg && cfg.tokens) || '')
    cfgCache.tokens = raw.split(/[\s,;，；]+/).map(function (s) { return s.trim() }).filter(Boolean)
    cfgCache.allowCors = !cfg || cfg.allow_cors !== false
  } catch (e) {
    cfgCache.tokens = []
    cfgCache.allowCors = true
  }
  cfgCache.at = now
  return cfgCache
}

function requestToken(req) {
  const h = req.headers || {}
  const auth = String(h['authorization'] || '')
  if (auth.toLowerCase().indexOf('bearer ') === 0) return auth.slice(7).trim()
  if (h['x-api-token']) return String(h['x-api-token']).trim()
  if (req.query && req.query.token) return String(req.query.token).trim()
  return ''
}

function isElevated(req, cfg) {
  const p = (req.context && req.context.principal) || {}
  if (p.type === 'user' || p.type === 'api_key') return true
  const t = requestToken(req)
  return t !== '' && cfg.tokens.indexOf(t) !== -1
}

function applyCors(res, cfg) {
  if (!cfg.allowCors) return
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, X-API-Token, Content-Type')
  res.setHeader('Access-Control-Max-Age', '86400')
}

/* ------------------------------ 数据获取 ------------------------------ */

async function rpc(method, params) {
  return await server.call(method, params || {})
}

// 一次性拿全：静态信息 + 实时状态
async function fetchNodes() {
  const results = await Promise.all([
    rpc('admin:listClients'),
    rpc('common:getNodesLatestStatus'),
  ])
  return { clients: results[0] || [], live: results[1] || {} }
}

function findClient(clients, uuid) {
  for (let i = 0; i < clients.length; i++) {
    if (clients[i].uuid === uuid) return clients[i]
  }
  return null
}

/* ------------------------------ 字段投影 ------------------------------ */

// 静态信息白名单。agent token 等敏感字段不在此列，永远不会泄露。
function pickNode(c, elevated) {
  const node = {
    uuid: c.uuid,
    name: c.name,
    region: c.region || '',
    group: c.group || '',
    tags: tagList(c.tags),
    hidden: !!c.hidden,
    weight: c.weight || 0,
    cpu: {
      name: c.cpu_name || '',
      cores: c.cpu_cores || 0,
      physical_cores: c.cpu_physical_cores || 0,
    },
    gpu_name: c.gpu_name || '',
    arch: c.arch || '',
    os: c.os || '',
    kernel_version: c.kernel_version || '',
    virtualization: c.virtualization || '',
    mem_total: c.mem_total || 0,
    swap_total: c.swap_total || 0,
    disk_total: c.disk_total || 0,
    billing: {
      price: c.price || 0,
      currency: c.currency || '',
      cycle_days: c.billing_cycle || 0,
      auto_renewal: !!c.auto_renewal,
      expired_at: c.expired_at || null,
    },
    traffic_limit: c.traffic_limit || 0,
    traffic_limit_type: c.traffic_limit_type || 'max',
    public_remark: c.public_remark || '',
    created_at: c.created_at || null,
  }
  if (elevated) {
    node.remark = c.remark || ''
    node.ipv4 = c.ipv4 || ''
    node.ipv6 = c.ipv6 || ''
    node.agent_version = c.version || ''
  }
  return node
}

// 实时状态投影（来自 getNodesLatestStatus 的最新上报）
function pickLive(r) {
  if (!r) return null
  return {
    time: r.time || null,
    online: !!r.online,
    uptime: r.uptime || 0,
    cpu: r.cpu || 0,
    ram: { used: r.ram || 0, total: r.ram_total || 0 },
    swap: { used: r.swap || 0, total: r.swap_total || 0 },
    disk: { used: r.disk || 0, total: r.disk_total || 0 },
    load: { load1: r.load || 0, load5: r.load5 || 0, load15: r.load15 || 0 },
    temp: r.temp || 0,
    network: {
      up: r.net_out || 0,
      down: r.net_in || 0,
      total_up: r.net_total_up || 0,
      total_down: r.net_total_down || 0,
    },
    connections: {
      tcp: Math.max(0, (r.connections || 0) - (r.connections_udp || 0)),
      udp: r.connections_udp || 0,
    },
    process: r.process || 0,
    gpu: r.gpu_count ? {
      count: r.gpu_count,
      usage: r.gpu_average_usage || 0,
      devices: r.gpu_detailed_info || [],
    } : null,
    ping: r.ping || {},
  }
}

function weightSort(a, b) {
  if ((b.weight || 0) !== (a.weight || 0)) return (b.weight || 0) - (a.weight || 0)
  return String(a.name).localeCompare(String(b.name))
}

/* --------------------------------- 路由 --------------------------------- */

function route(fn) {
  return function (req, res) {
    let cfg
    return loadConfig()
      .then(function (c) {
        cfg = c
        applyCors(res, cfg)
        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return null
        }
        return fn(req, res, cfg)
      })
      .catch(function (e) {
        const code = e && typeof e.code === 'number' ? e.code : 0
        if (code === -32602) fail(res, 400, 'invalid_params', e.message)
        else if (code === -32044) fail(res, 404, 'not_found', e.message)
        else if (code === -32041) fail(res, 403, 'permission_denied', e.message)
        else if (code === -32601) fail(res, 404, 'method_not_found', e.message)
        else fail(res, 500, 'internal_error', (e && e.message) || String(e))
      })
  }
}

// uuid 级接口统一的可见性闸门：不存在或(匿名视角下的)隐藏节点一律 404，不泄露存在性
async function visibleClient(req, res, cfg, uuid) {
  const clients = await rpc('admin:listClients')
  const c = findClient(clients, uuid)
  if (!c || (c.hidden && !isElevated(req, cfg))) {
    fail(res, 404, 'not_found', 'node not found')
    return null
  }
  return clients
}

/* 接口索引 */
function apiIndex(req, res) {
  json(res, 200, {
    name: 'Komari Open API',
    plugin: 'api',
    version: PLUGIN_VERSION,
    docs: DOCS_URL,
    auth: {
      anonymous: '访客视角：隐藏节点不可见，敏感字段为空',
      token: 'Authorization: Bearer <token> 或 ?token=<token> 或 X-API-Token: <token>',
    },
    endpoints: ENDPOINTS,
  })
}

/* 站点概览：一次请求拿齐渲染一张卡片所需的全部数据 */
async function overview(req, res, cfg) {
  const elevated = isElevated(req, cfg)
  const results = await Promise.all([
    fetchNodes(),
    rpc('public:getPublicSettings'),
    rpc('public:getVersion'),
  ])
  const fetched = results[0]
  const site = results[1] || {}
  const version = results[2] || {}

  const nodes = []
  let online = 0
  const clients = fetched.clients
  for (let i = 0; i < clients.length; i++) {
    const c = clients[i]
    if (c.hidden && !elevated) continue
    const live = pickLive(fetched.live[c.uuid])
    if (live && live.online) online++
    const node = pickNode(c, elevated)
    node.online = !!(live && live.online)
    node.live = live
    nodes.push(node)
  }
  nodes.sort(weightSort)

  json(res, 200, {
    site: {
      sitename: site.sitename || '',
      logo: site.logo || '',
      favicon: site.favicon || '',
    },
    version: version.version || '',
    summary: {
      total: nodes.length,
      online: online,
      offline: nodes.length - online,
    },
    generated_at: new Date().toISOString(),
    nodes: nodes,
  })
}

/* 节点列表 */
async function listNodes(req, res, cfg) {
  const elevated = isElevated(req, cfg)
  const withLive = String((req.query && req.query.live) || 'true').toLowerCase() !== 'false'
  const group = String((req.query && req.query.group) || '').trim()

  const fetched = await fetchNodes()
  const nodes = []
  const clients = fetched.clients
  for (let i = 0; i < clients.length; i++) {
    const c = clients[i]
    if (c.hidden && !elevated) continue
    if (group && c.group !== group) continue
    const node = pickNode(c, elevated)
    const live = withLive ? pickLive(fetched.live[c.uuid]) : null
    node.online = !!(live && live.online)
    if (live) node.live = live
    nodes.push(node)
  }
  nodes.sort(weightSort)

  json(res, 200, { count: nodes.length, nodes: nodes })
}

/* 节点详情 */
async function nodeDetail(req, res, cfg) {
  const uuid = splitPath(req.url)[3]
  const clients = await visibleClient(req, res, cfg, uuid)
  if (!clients) return
  const c = findClient(clients, uuid)
  const elevated = isElevated(req, cfg)
  const fetched = await fetchNodes()
  const live = pickLive(fetched.live[uuid])
  const node = pickNode(c, elevated)
  node.online = !!(live && live.online)
  node.live = live
  json(res, 200, node)
}

/* 历史负载记录 */
async function nodeRecords(req, res, cfg) {
  const uuid = splitPath(req.url)[3]
  const clients = await visibleClient(req, res, cfg, uuid)
  if (!clients) return
  const q = req.query || {}
  const hours = queryInt(q.hours, 4, 1, 720)
  const loadType = String(q.load_type || 'all')
  const valid = { '': 1, all: 1, cpu: 1, ram: 1, swap: 1, load: 1, temp: 1, disk: 1, network: 1, process: 1, connections: 1 }
  if (!valid[loadType]) {
    fail(res, 400, 'invalid_params', 'load_type 仅支持 all/cpu/ram/swap/load/temp/disk/network/process/connections')
    return
  }
  const data = await rpc('public:getRecordsByUUID', { uuid: uuid, hours: String(hours), load_type: loadType })
  data.uuid = uuid
  data.hours = hours
  json(res, 200, data)
}

/* Ping 任务列表 */
async function pingTasks(req, res) {
  const tasks = await rpc('public:getPublicPingTasks')
  json(res, 200, { count: (tasks || []).length, tasks: tasks || [] })
}

/* Ping 记录 */
async function pingRecords(req, res, cfg) {
  const q = req.query || {}
  const uuid = String(q.uuid || '').trim()
  const taskId = String(q.task_id || '').trim()
  if (!uuid && !taskId) {
    fail(res, 400, 'invalid_params', 'uuid 与 task_id 至少提供一个')
    return
  }
  if (uuid) {
    const clients = await visibleClient(req, res, cfg, uuid)
    if (!clients) return
  }
  const hours = queryInt(q.hours, 1, 1, 720)
  const data = await rpc('public:getPingRecords', { uuid: uuid, task_id: taskId, hours: String(hours) })
  data.hours = hours
  json(res, 200, data)
}

/* --------------------------------- 注册 --------------------------------- */

function load() {
  for (let i = 0; i < ROUTE_PATHS.length; i++) {
    const p = ROUTE_PATHS[i]
    server.route('OPTIONS', p, function (req, res) { applyCors(res, cfgCache); res.statusCode = 204; res.end() })
  }

  server.route('GET', '/api/v1', route(apiIndex))
  server.route('GET', '/api/v1/overview', route(overview))
  server.route('GET', '/api/v1/nodes', route(listNodes))
  server.route('GET', '/api/v1/nodes/:uuid', route(nodeDetail))
  server.route('GET', '/api/v1/nodes/:uuid/records', route(nodeRecords))
  server.route('GET', '/api/v1/ping/tasks', route(pingTasks))
  server.route('GET', '/api/v1/ping/records', route(pingRecords))

  console.log('[komari-api] 开放 API 已就绪：/api/v1 (v' + PLUGIN_VERSION + ')')
}
