# GET /api/v1/nodes/{uuid}/records

节点的历史负载记录，来自面板的持久化监控数据。适合画趋势图、生成日报。

```bash
curl "https://你的面板域名/api/v1/nodes/{uuid}/records?hours=24&load_type=all"
```

## 查询参数

| 参数 | 类型 | 默认 | 范围 | 说明 |
| --- | --- | --- | --- | --- |
| `hours` | number | `4` | 1 - 720 | 拉取最近多少小时 |
| `load_type` | string | `all` | 见下表 | 只看某一类指标 |

`load_type` 取值：`all` / `cpu` / `ram` / `swap` / `load` / `temp` / `disk` / `network` / `process` / `connections`

## 响应示例

```json
{
  "uuid": "58c1d45a-cd0e-4733-8278-4e495a3364f7",
  "hours": 2,
  "load_type": "all",
  "count": 1,
  "has_gpu_data": false,
  "records": [
    {
      "client": "58c1d45a-cd0e-4733-8278-4e495a3364f7",
      "time": "2026-09-26T13:50:00Z",
      "cpu": 23.5,
      "gpu": 0,
      "ram": 12884901888,
      "ram_total": 0,
      "swap": 104857600,
      "swap_total": 0,
      "load": 0.42,
      "temp": 0,
      "disk": 42949672960,
      "disk_total": 0,
      "net_in": 48234496,
      "net_out": 12582912,
      "net_total_up": 109951162777,
      "net_total_down": 549755813888,
      "traffic_up": 0,
      "traffic_down": 0,
      "process": 216,
      "connections": 182,
      "connections_udp": 37
    }
  ]
}
```

`load_type` 指定单项时，`records` 中只保留对应指标，并附带 `load_type` 字段；节点有 GPU 数据时另有 `gpu_devices`（按设备分组的显存 / 利用率 / 温度记录）。

## 字段说明

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `time` | string | 记录时间（面板按分钟聚合） |
| `cpu` / `gpu` | number | 使用率（%） |
| `ram` / `swap` / `disk` | number | 已用（字节）；`*_total` 在历史记录里恒为 0，总量请用节点静态字段 |
| `load` | number | 1 分钟负载 |
| `temp` | number | 温度（°C） |
| `net_in` / `net_out` | number | 下行 / 上行速率（B/s） |
| `net_total_up` / `net_total_down` | number | 累计上传 / 下载（字节） |
| `traffic_up` / `traffic_down` | number | 周期流量统计（字节） |
| `process` | number | 进程数 |
| `connections` / `connections_udp` | number | 总连接数 / UDP 连接数 |

::: tip 画图建议
CPU / 内存 / 磁盘用面积图，网络速率用双线图（`net_in` / `net_out`）。`ram_total` 等总盘子数据在记录里恒为 0，请从节点静态信息取。
:::
