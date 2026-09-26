---
layout: home

hero:
  name: Komari Open API
  text: 控制台能看到的，API 就能查到
  tagline: Komari 探针开放接口插件 —— 节点列表、实时状态、历史负载、Ping 记录，规范的 REST API，一个 GET 渲染一张状态卡。
  actions:
    - theme: brand
      text: 开始使用
      link: /guide/getting-started
    - theme: alt
      text: API 参考
      link: /api/

features:
  - icon: 🚀
    title: 开箱即用
    details: 上传插件、点击启用，API 直接挂在面板域名下，无需反向代理、无需改配置文件。
  - icon: 📦
    title: 一次拿全
    details: GET /api/v1/overview 返回站点信息、汇总统计与全部节点实时状态，一个请求渲染整张卡片。
  - icon: 🔐
    title: 视角收敛
    details: 匿名访客看不到隐藏节点，令牌与管理员看到完整数据，Agent Token 等敏感字段永远不会出现在响应里。
  - icon: ⚡
    title: 数据零搬运
    details: 实时读取面板自身数据，不落地、不建表、不依赖定时任务，查到的永远是控制台里那一份数据。
  - icon: 🌐
    title: 浏览器友好
    details: 全 GET 语义、标准状态码、CORS 支持，网页与小程序可以直接调用。
  - icon: 🤖
    title: 为机器人而生
    details: 字段名与面板一致、单位统一为字节、时间统一为 ISO 8601，拿来即用，不需要二次换算。
---
