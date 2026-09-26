# GET /api/v1/nodes/{uuid}

单个节点的完整详情：静态信息 + 实时状态，结构同 [`/overview`](./overview) 的单个节点。

```bash
curl https://你的面板域名/api/v1/nodes/58c1d45a-cd0e-4733-8278-4e495a3364f7
```

## 路径参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `uuid` | string | 节点 UUID，可从 [`/nodes`](./nodes) 列表获取 |

## 响应示例

```json
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
  "live": { "...": "同 /overview 的 live 结构" }
}
```

## 错误

| 状态码 | 场景 |
| --- | --- |
| 404 | 节点不存在，或匿名视角下为隐藏节点 |

字段说明见 [`/overview`](./overview#字段说明)。
