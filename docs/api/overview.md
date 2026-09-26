# GET /api/v1/overview

站点概览。一次请求返回站点信息、汇总统计与全部节点的实时状态 —— 渲染一张完整状态卡所需的全部数据。

```bash
curl https://你的面板域名/api/v1/overview
```

## 响应示例

```json
{
  "site": {
    "sitename": "我的监控站",
    "logo": "",
    "favicon": ""
  },
  "version": "1.5.1",
  "summary": {
    "total": 3,
    "online": 2,
    "offline": 1
  },
  "generated_at": "2026-09-26T13:52:30.120Z",
  "nodes": [
    {
      "uuid": "58c1d45a-cd0e-4733-8278-4e495a3364f7",
      "name": "东京节点 · JP-01",
      "region": "🇯🇵",
      "group": "production",
      "tags": ["日本", "高级版"],
      "hidden": false,
      "weight": 100,
      "cpu": { "name": "AMD EPYC 9654", "cores": 8, "physical_cores": 4 },
      "gpu_name": "",
      "arch": "x86_64",
      "os": "Ubuntu 24.04 LTS",
      "kernel_version": "6.8.0-45-generic",
      "virtualization": "kvm",
      "mem_total": 34359738368,
      "swap_total": 2147483648,
      "disk_total": 107374182400,
      "billing": {
        "price": 199,
        "currency": "CNY",
        "cycle_days": 30,
        "auto_renewal": false,
        "expired_at": "2027-03-01T00:00:00Z"
      },
      "traffic_limit": 1099511627776,
      "traffic_limit_type": "max",
      "public_remark": "限量款 10Gbps 大带宽",
      "created_at": "2026-09-26T13:49:40Z",
      "online": true,
      "live": {
        "time": "2026-09-26T13:52:33Z",
        "online": true,
        "uptime": 864000,
        "cpu": 23.5,
        "ram": { "used": 12884901888, "total": 34359738368 },
        "swap": { "used": 104857600, "total": 2147483648 },
        "disk": { "used": 42949672960, "total": 107374182400 },
        "load": { "load1": 0.42, "load5": 0.38, "load15": 0.31 },
        "temp": 0,
        "network": {
          "up": 12582912,
          "down": 48234496,
          "total_up": 109951162777,
          "total_down": 549755813888
        },
        "connections": { "tcp": 182, "udp": 37 },
        "process": 216,
        "gpu": null,
        "ping": { "日本 → Cloudflare": { "name": "日本 → Cloudflare", "latest": 44, "avg": 44, "tail": 0, "loss": 0, "min": 39, "max": 51 } }
      }
    }
  ]
}
```

## 字段说明

### 顶层

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `site` | object | 站点名称、Logo、favicon（面板公开设置） |
| `version` | string | 面板版本 |
| `summary` | object | `total` / `online` / `offline` 节点计数（按调用者可见范围统计） |
| `generated_at` | string | 响应生成时间 |
| `nodes` | array | 节点数组，按 `weight` 降序、名称升序排列 |

### 节点静态字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `uuid` | string | 节点唯一标识，也是其他接口的 `{uuid}` 参数 |
| `name` | string | 节点名称 |
| `region` | string | 地区（面板geoip识别结果） |
| `group` | string | 分组 |
| `tags` | string[] | 标签 |
| `hidden` | boolean | 是否隐藏节点（仅令牌/管理员视角可见） |
| `weight` | number | 权重 |
| `cpu` | object | `name` 型号 / `cores` 逻辑核数 / `physical_cores` 物理核数 |
| `gpu_name` | string | GPU 型号 |
| `arch` / `os` / `kernel_version` / `virtualization` | string | 系统信息 |
| `mem_total` / `swap_total` / `disk_total` | number | 内存 / 交换 / 磁盘总量（字节） |
| `billing` | object | `price` 价格 / `currency` 币种 / `cycle_days` 计费周期天数 / `auto_renewal` 自动续费 / `expired_at` 到期时间 |
| `traffic_limit` | number | 流量限额（字节），`0` 表示不限 |
| `traffic_limit_type` | string | 限额口径：`sum` / `max` / `min` / `up` / `down` |
| `public_remark` | string | 公开备注 |
| `created_at` | string | 节点接入时间 |

以下字段仅在**令牌 / 管理员**视角返回：`remark`（私密备注）、`ipv4`、`ipv6`、`agent_version`。

### `live` 实时状态

来自节点最近一次上报，匿名视角同样可见（隐藏节点除外）。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `time` | string | 上报时间 |
| `online` | boolean | 是否在线（面板在线判定：Agent 连接存活） |
| `uptime` | number | 开机时长（秒） |
| `cpu` | number | CPU 使用率（%） |
| `ram` / `swap` / `disk` | object | `used` / `total`（字节） |
| `load` | object | `load1` / `load5` / `load15` |
| `temp` | number | 温度（°C），无传感器时为 0 |
| `network` | object | `up` / `down` 实时速率（B/s），`total_up` / `total_down` 累计流量（字节） |
| `connections` | object | `tcp` / `udp` 连接数 |
| `process` | number | 进程数 |
| `gpu` | object \| null | `count` 数量 / `usage` 平均使用率 / `devices` 各设备明细 |
| `ping` | object | 以任务名为键的延迟统计：`latest` / `avg` / `min` / `max`（ms）、`loss` 丢包率（%）、`tail` 抖动指数 |

节点离线或从未上报时 `live` 中各指标为 `0`，`online` 为 `false`。
