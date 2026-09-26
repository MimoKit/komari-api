import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: 'zh-CN',
  title: 'Komari Open API',
  description: '把 Komari 探针控制台里的服务器状态，变成规范的 REST API',
  // GitHub Pages 项目站点路径
  base: '/komari-api/',
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/komari-api/logo.svg' }]],
  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'Komari Open API',
    nav: [
      { text: '指南', link: '/guide/getting-started', activeMatch: '/guide/' },
      { text: 'API 参考', link: '/api/', activeMatch: '/api/' },
      { text: '示例', link: '/guide/examples', activeMatch: '/guide/examples' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: '指南',
          items: [
            { text: '开始使用', link: '/guide/getting-started' },
            { text: '鉴权与可见性', link: '/guide/auth' },
            { text: '调用示例', link: '/guide/examples' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API 参考',
          items: [
            { text: '约定与错误码', link: '/api/' },
            { text: 'GET /api/v1/overview', link: '/api/overview' },
            { text: 'GET /api/v1/nodes', link: '/api/nodes' },
            { text: 'GET /api/v1/nodes/{uuid}', link: '/api/node-detail' },
            { text: 'GET /api/v1/nodes/{uuid}/records', link: '/api/records' },
            { text: 'GET /api/v1/ping', link: '/api/ping' },
          ],
        },
      ],
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/MimoKit/komari-api' }],
    outline: { level: [2, 3], label: '本页目录' },
    docFooter: { prev: '上一页', next: '下一页' },
    lastUpdated: { text: '最后更新' },
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
          modal: {
            noResultsText: '没有找到结果',
            resetButtonTitle: '清除查询',
            footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' },
          },
        },
      },
    },
  },
})
