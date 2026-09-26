# GET /api/v1/nodes

节点列表。与 [`/overview`](./overview) 中的节点结构一致，但不带站点信息与汇总统计 —— 只要节点清单时用这个，更轻。

```bash
curl https://你的面板域名/api/v1/nodes
```

## 查询参数

| 参数 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `group` | string | - | 按分组过滤，精确匹配 |
| `live` | boolean | `true` | 设为 `false` 时只返回静态信息，不带 `live` 实时数据 |

## 响应示例

```json
{
  "count": 2,
  "nodes": [
    {
      "uuid": "58c1d45a-cd0e-4733-8278-4e495a3364f7",
      "name": "东京节点 · JP-01",
      "...": "同 /overview 的节点结构"
    },
    {
      "uuid": "5f8b4a20-b9a5-4185-8b1f-62e773019a3e",
      "name": "大阪中转 · JP-02",
      "...": "..."
    }
  ]
}
```

## 示例

只要清单，不要实时数据（卡片列表页常用）：

```bash
curl "https://你的面板域名/api/v1/nodes?live=false"
```

只看生产分组：

```bash
curl "https://你的面板域名/api/v1/nodes?group=production"
```

## 可见性

- 匿名：隐藏节点不返回
- 令牌 / 管理员：隐藏节点正常返回（`hidden: true` 标记），并附带 `ipv4` / `ipv6` / `remark` / `agent_version`
