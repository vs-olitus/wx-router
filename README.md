# 通用小程序智能跳转 & API 抓取工具

一个在微信小程序 **CDP 调试环境**中运行的脚本，可自动遍历所有页面、智能分类导航，并通过 Hook `wx.request` 实时捕获所有 API 请求。

> **适用场景**：小程序安全测试、接口梳理、功能探索。请仅在**你拥有合法授权**的小程序上使用。

---

## 功能特性

- **自动检测环境**：自动识别小程序逻辑层 / iframe Frame 环境，无需手动配置
- **页面智能分类**：将所有页面按功能（登录、首页、列表、详情、订单、支付等）自动分组
- **便捷导航**：按序号、关键词、URL 三种方式跳转页面
- **自动遍历**：一键访问所有页面，支持范围、关键词过滤和自定义等待时长
- **API 捕获**：Hook `wx.request` / `wx.uploadFile` / `wx.downloadFile`，实时记录所有网络请求
- **去重导出**：自动对 API 去重，支持导出 JSON 并复制到剪贴板
- **实时监听**：停留在当前页面手动操作，持续监听 API 请求

---

## 使用方法

### 1. 打开 CDP 调试环境

在微信开发者工具或真机调试的 Chrome DevTools 中，打开 **Console** 面板。

### 2. 注入脚本

将 `main.js` 的全部内容粘贴到 Console 并回车执行。

脚本会自动：
1. 检测小程序环境
2. 加载页面配置
3. 对页面分类
4. 打印导航菜单并创建全局对象 `nav`

### 3. 开始使用

---

## 命令速查

### 导航命令

| 命令 | 说明 |
|------|------|
| `nav.go(数字)` | 跳转到指定序号的页面 |
| `nav.goTo("页面路径")` | 直接跳转到指定路径（自动判断 TabBar / 普通页面） |
| `nav.search("关键词")` | 按关键词搜索页面 |
| `nav.showAll()` | 查看所有分类及页面数量 |
| `nav.showAll("分类名")` | 查看指定分类的完整页面列表 |
| `nav.current()` | 显示当前所在页面路径 |
| `nav.back()` | 返回上一页 |
| `nav.back(2)` | 返回 N 级页面 |
| `nav.refresh()` | 重新扫描小程序并刷新菜单 |

**分类名称**：`tabbar` / `auth` / `home` / `list` / `detail` / `form` / `user` / `order` / `payment` / `setting` / `other`

### 自动访问 & API 抓取

| 命令 | 说明 |
|------|------|
| `nav.autoVisit()` | 自动访问所有页面（每页等待 3 秒） |
| `nav.autoVisit({delay: 5000})` | 每页等待 5 秒 |
| `nav.autoVisit({start: 10, end: 20})` | 只访问第 10 到 20 个页面 |
| `nav.autoVisit({filter: "order"})` | 只访问路径中包含 `order` 的页面 |
| `nav.stopAutoVisit()` | 停止自动访问（当前页面访问完成后停止） |
| `nav.listen(30000)` | 停留当前页面手动操作，监听 30 秒内的 API 请求 |
| `nav.getResults()` | 查看自动访问的详细结果 |
| `nav.getAPIs()` | 查看去重后的完整 API 列表 |
| `nav.exportAPIs()` | 导出 JSON 格式的 API 数据（自动复制到剪贴板） |

---

## 使用示例

```js
// 访问所有页面，每页等5秒
nav.autoVisit({ delay: 5000 })

// 只访问包含 "user" 的页面
nav.autoVisit({ filter: "user" })

// 只访问第 5 到 15 个页面
nav.autoVisit({ start: 5, end: 15 })

// 手动操作小程序，同时监听60秒内的API请求
nav.listen(60000)

// 自动访问结束后，查看去重API列表
nav.getAPIs()

// 导出完整JSON
nav.exportAPIs()
```

---

## autoVisit 参数说明

```js
nav.autoVisit({
  delay: 3000,       // 每个页面停留时间（毫秒），默认 3000
  start: 1,          // 起始页面序号（从 1 开始），默认第 1 个
  end: 50,           // 结束页面序号，默认全部
  filter: "keyword", // URL 或页面名包含该关键词才访问，默认不过滤
})
```

---

## exportAPIs 输出格式

```json
{
  "timestamp": "2026-04-02T10:00:00.000Z",
  "appid": "wx1234567890",
  "totalPages": 35,
  "totalAPIs": 128,
  "apiList": [
    { "method": "GET", "url": "https://api.example.com/user/info", "path": "/user/info" },
    { "method": "POST", "url": "https://api.example.com/order/create", "path": "/order/create" }
  ],
  "pageDetails": {
    "pages/user/index": [
      { "method": "GET", "url": "https://api.example.com/user/info", "path": "/user/info" }
    ]
  }
}
```

---

## 工作原理

1. **环境检测**：依次检查 `window`、`window.frames`、`window.parent.frames` 中是否存在 `wx` 对象和 `__wxConfig`
2. **页面加载**：从 `__wxConfig.pages` 读取全部页面列表，从 `__wxConfig.tabBar` 读取 TabBar 配置
3. **页面分类**：通过关键词匹配（支持中英文）将页面归类
4. **跳转策略**：自动访问时统一使用 `wx.reLaunch`，确保页面栈始终只有 1 层，防止内存溢出
5. **API Hook**：替换 `wx.request` / `wx.uploadFile` / `wx.downloadFile`，在调用原始方法前记录请求信息，使用 `Set` 实现 O(1) 去重

---

## 注意事项

- 需要在小程序的 **CDP 调试环境**（微信开发者工具 Console 或 Chrome DevTools）中运行
- `autoVisit` 会使用 `reLaunch` 跳转，会销毁当前页面栈，正常使用时不影响功能
- 部分需要登录态或特定参数的页面跳转后可能显示错误，属于正常现象
- 监听到的 API 包含完整 URL（含域名和参数），导出时同时保留原始 URL 和路径

---

## License

MIT
