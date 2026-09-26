# Komari 开放 API

> 把 [Komari](https://github.com/komari-monitor/komari) 探针控制台里的服务器状态，变成一套规范的 REST API。

Komari 本身没有对外查询接口 —— 状态只能登录控制台看。这个插件补上了这一块：装上即用，控制台能看到的，`/api/v1` 就能查到。机器人插件、脚本、自建面板，一个 GET 拿齐渲染一张状态卡所需的全部数据。

## 特性

- **开箱即用** —— 上传插件、启用，API 直接挂在你绑定面板的域名下：`https://你的面板域名/api/v1/...`
- **一次拿全** —— `GET /api/v1/overview` 返回站点信息、汇总统计和全部节点的实时状态，一个请求渲染整张卡片
- **视角收敛** —— 匿名访客看不到隐藏节点，令牌 / 管理员身份看到完整数据；agent token 等敏感字段永远不会出现在响应里
- **数据零搬运** —— 全部实时读取面板自身数据，不做任何额外存储，无需改表结构

## 接口总览

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/v1` | 接口索引与版本信息 |
| GET | `/api/v1/overview` | 站点信息 + 汇总统计 + 全部节点实时状态 |
| GET | `/api/v1/nodes` | 节点列表（`?group=` 过滤、`?live=false` 关闭实时） |
| GET | `/api/v1/nodes/{uuid}` | 节点详情 |
| GET | `/api/v1/nodes/{uuid}/records` | 历史负载记录 |
| GET | `/api/v1/ping/tasks` | Ping 任务列表 |
| GET | `/api/v1/ping/records` | Ping 记录 |

## 快速开始

1. 从 [Releases](https://github.com/MimoKit/komari-api/releases) 下载 `komari-plugin-api.zip`
2. 面板管理后台 → 插件 → 安装，上传并启用
3. 试一下：

```bash
curl https://你的面板域名/api/v1/overview
```

详细用法（鉴权、字段说明、错误码、机器人卡片示例）见 **[中文文档](docs/README.md)**。

## 环境要求

- Komari `>= 1.0.0`（插件系统需要较新版本，建议直接用最新版）

## 开源协议

[MIT](LICENSE)
