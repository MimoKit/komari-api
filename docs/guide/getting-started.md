# 开始使用

Komari Open API 是一个 [Komari](https://github.com/komari-monitor/komari) 服务端插件。它把控制台里看得到的节点状态暴露成一套规范的 REST 接口，供机器人插件、脚本与自建面板调用。

## 安装

1. 在 [Releases](https://github.com/MimoKit/komari-api/releases) 下载 `komari-plugin-api.zip`
2. 打开面板管理后台 → **插件** → **安装插件**，上传压缩包
3. 点击 **启用**，在弹出的权限确认里同意 —— 本插件需要两项权限：

| 权限 | 用途 |
| --- | --- |
| 注册 HTTP 路由（allowRoutes） | 把 API 挂载到面板域名下 |
| 调用系统 RPC（allowSystemRPC） | 以面板身份读取节点与监控数据 |

插件不申请文件、进程、端口等任何其他权限。

## 验证

启用后直接访问：

```bash
curl https://你的面板域名/api/v1
```

返回接口索引即安装成功：

```json
{
  "name": "Komari Open API",
  "version": "1.0.0",
  "endpoints": [ ... ]
}
```

## 配置

在 管理后台 → 插件 → 开放 API → 配置 中可以调整：

| 配置项 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| 访问令牌 | 多行文本 | 空 | 每行一个令牌。详见[鉴权与可见性](/guide/auth) |
| 允许浏览器跨域调用 | 开关 | 开 | 关闭后插件不再追加 `Access-Control-Allow-Origin: *` |

保存后立即生效，无需重启面板。

## 环境要求

- Komari `>= 1.0.0`（需要插件系统，建议使用最新版）
- 插件版本与 Komari 版本独立演进，升级插件重新上传压缩包即可
