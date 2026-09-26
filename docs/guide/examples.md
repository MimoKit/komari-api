# 调用示例

## cURL

```bash
# 全站概览（渲染一张状态卡所需的全部数据）
curl https://你的面板域名/api/v1/overview

# 带令牌查看含隐藏节点的完整数据
curl -H "Authorization: Bearer 你的令牌" https://你的面板域名/api/v1/nodes

# 某节点最近 24 小时的 CPU 曲线
curl "https://你的面板域名/api/v1/nodes/{uuid}/records?hours=24&load_type=cpu"
```

## Python

同步（requests）：

```python
import requests

BASE = "https://你的面板域名/api/v1"
HEADERS = {"Authorization": "Bearer 你的令牌"}

def overview() -> dict:
    r = requests.get(f"{BASE}/overview", headers=HEADERS, timeout=10)
    r.raise_for_status()
    return r.json()

data = overview()
print(f"在线 {data['summary']['online']}/{data['summary']['total']}")
for n in data["nodes"]:
    live = n["live"]
    print(f"{n['name']:<16} {'🟢' if n['online'] else '🔴'} "
          f"CPU {live['cpu']:5.1f}%  "
          f"内存 {live['ram']['used'] / 2**30:5.1f}G/{n['mem_total'] / 2**30:.0f}G")
```

异步（httpx，机器人插件常用）：

```python
import httpx

async def fetch_overview() -> dict:
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(f"{BASE}/overview", headers=HEADERS)
        r.raise_for_status()
        return r.json()
```

## 机器人状态卡

以「查一下某台服务器」的机器人为例，从请求到渲染的最短路径：

```python
def render_card(node: dict) -> str:
    live = node["live"] or {}
    used = live.get("ram", {}).get("used", 0)
    total = node["mem_total"] or 1
    bar = "█" * int(live.get("cpu", 0) // 10 or 0)
    return "\n".join([
        f"🖥 {node['name']}  {'🟢 在线' if node['online'] else '🔴 离线'}",
        f"CPU  {bar} {live.get('cpu', 0):.1f}%",
        f"内存 {fmt(used)} / {fmt(node['mem_total'])}",
        f"硬盘 {fmt(live.get('disk', {}).get('used', 0))} / {fmt(node['disk_total'])}",
        f"网络 ↓{fmt(live.get('network', {}).get('down', 0))}/s ↑{fmt(live.get('network', {}).get('up', 0))}/s",
        f"流量 ↓{fmt(live.get('network', {}).get('total_down', 0))}"
        f" / 限额 {fmt(node['traffic_limit']) if node['traffic_limit'] else '不限'}",
        f"运行 {live.get('uptime', 0) // 86400} 天",
    ])

def fmt(n: float) -> str:
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if n < 1024:
            return f"{n:.1f}{unit}"
        n /= 1024
    return f"{n:.1f}PB"
```

::: tip 找节点
机器人命令的参数通常是用户输入的节点名。先拉 `/api/v1/nodes?live=false` 做一份 `name → uuid` 的映射缓存（建议 5 分钟），再按 `uuid` 查详情或记录。
:::

## 监控大盘

30 秒轮询概览接口的最小实现（浏览器环境）：

```javascript
const BASE = "https://你的面板域名/api/v1";

async function poll() {
  const { summary, nodes } = await (await fetch(`${BASE}/overview`)).json();
  document.title = `🟢${summary.online} 🔴${summary.offline} — Komari`;
  // 渲染 nodes...
}

poll();
setInterval(poll, 30_000);
```

## 接口索引

不确定字段含义时，随时可以看接口索引：

```bash
curl https://你的面板域名/api/v1
```
