# GET /api/v1/ping

Ping（节点间连通性）相关接口，分为任务列表与延迟记录两支。

## GET /api/v1/ping/tasks

列出所有 Ping 任务。

```bash
curl https://你的面板域名/api/v1/ping/tasks
```

```json
{
  "count": 1,
  "tasks": [
    {
      "id": 1,
      "weight": 1,
      "name": "日本 → Cloudflare",
      "clients": ["58c1d45a-cd0e-4733-8278-4e495a3364f7"],
      "default_on": false,
      "type": "icmp",
      "interval": 60
    }
  ]
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | number | 任务 ID，查询记录时的 `task_id` |
| `name` | string | 任务名称（也是节点 `live.ping` 统计的键） |
| `clients` | string[] | 参与该任务的节点 UUID |
| `default_on` | boolean | 是否对所有节点默认开启 |
| `type` | string | `icmp` / `tcp` / `http` |
| `interval` | number | 探测间隔（秒） |

## GET /api/v1/ping/records

查询延迟记录。`uuid` 与 `task_id` 至少提供一个。

```bash
curl "https://你的面板域名/api/v1/ping/records?uuid={uuid}&hours=1"
curl "https://你的面板域名/api/v1/ping/records?task_id=1&hours=6"
```

### 查询参数

| 参数 | 类型 | 默认 | 范围 | 说明 |
| --- | --- | --- | --- | --- |
| `uuid` | string | - | 与 `task_id` 二选一 | 按节点查询 |
| `task_id` | number | - | 与 `uuid` 二选一 | 按任务查询 |
| `hours` | number | `1` | 1 - 720 | 拉取最近多少小时 |

### 响应示例

```json
{
  "count": 1,
  "hours": 1,
  "basic_info": [
    { "client": "58c1d45a-cd0e-4733-8278-4e495a3364f7", "loss": 0, "min": 39, "max": 51 }
  ],
  "records": [
    { "task_id": 1, "time": "2026-09-26T13:52:00Z", "value": 45, "client": "58c1d45a-cd0e-4733-8278-4e495a3364f7" }
  ],
  "tasks": [
    { "id": 1, "name": "日本 → Cloudflare", "type": "icmp", "interval": 60, "avg": 44, "min": 39, "max": 51, "loss": 0, "total": 5, "default_on": false }
  ]
}
```

| 字段 | 说明 |
| --- | --- |
| `records` | 延迟明细，`value` 单位 ms |
| `basic_info` | 按节点聚合的最差 / 最好 / 丢包率 |
| `tasks` | 按任务聚合的统计（按 `uuid` 查询时附带，便于直接标注任务名） |

## 可见性

与节点接口一致：匿名查询隐藏节点的记录返回 `404`。
