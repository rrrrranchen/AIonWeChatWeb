# 微信小程序路由配置说明

## 项目结构

```
AIonWeChatWeb/
├── app.js                 # 应用入口文件
├── app.json               # 应用配置文件
├── app.wxss               # 全局样式
├── store.js               # 全局状态管理
├── pages/
│   ├── homePage/          # 首页（应用入口）
│   │   ├── homePage.js
│   │   ├── homePage.wxml
│   │   ├── homePage.wxss
│   │   └── homePage.json
│   └── login/             # 登录页
│       ├── login.js
│       ├── login.wxml
│       ├── login.wxss
│       └── login.json
├── components/
│   └── navigation-bar/    # 自定义导航栏组件
├── utils/
│   ├── router.js          # 路由管理工具
│   └── sessionManagers.js # 会话管理工具
└── project.config.json    # 项目配置
```

## 路由配置 (app.json)

```json
{
  "pages": [
    "pages/homePage/homePage", // 首页（应用入口）
    "pages/login/login"        // 登录页
  ]
}
```

## 路由工具使用

### 1. 导入路由工具

```javascript
import { navigateTo, redirectTo, pages } from '../../utils/router'
```

### 2. 页面跳转方法

#### navigateTo - 保留当前页面，跳转到新页面
```javascript
// 跳转到登录页
navigateTo(pages.login)

// 带参数跳转
navigateTo(pages.homePage, { userId: 123, type: 'user' })
```

#### redirectTo - 关闭当前页面，跳转到新页面
```javascript
// 登录成功后跳转到主页
redirectTo(pages.homePage)
```

#### reLaunch - 关闭所有页面，打开到应用内的某个页面
```javascript
// 重新启动到首页
reLaunch(pages.homePage)
```

#### navigateBack - 返回上一页面
```javascript
// 返回上一页
navigateBack()

// 返回多级页面
navigateBack(2)
```

### 3. 页面参数处理

#### 发送参数
```javascript
// 跳转时携带参数
navigateTo(pages.homePage, {
  userId: 123,
  userName: '张三',
  type: 'user'
})
```

#### 接收参数
```javascript
Page({
  onLoad(options) {
    // options 包含页面参数
    console.log('页面参数:', options)
    // 输出: { userId: "123", userName: "张三", type: "user" }
  }
})
```

## 页面路由流程

1. **应用启动** → `pages/homePage/homePage` (首页)
2. **用户点击登录** → `pages/login/login` (登录页)
3. **登录成功** → `pages/homePage/homePage` (返回首页，显示用户信息)
4. **用户注销** → `pages/login/login` (返回登录页)

## 注意事项

1. 页面路径必须以 `/` 开头
2. 使用 `redirectTo` 会关闭当前页面，无法返回
3. 使用 `navigateTo` 会保留当前页面，可以返回
4. 页面参数会自动进行 URL 编码和解码
5. 建议使用路由工具统一管理页面跳转，便于维护

## 扩展路由

如需添加新页面，请：

1. 在 `pages/` 目录下创建新页面文件夹
2. 在 `app.json` 的 `pages` 数组中添加页面路径
3. 在 `utils/router.js` 的 `pages` 对象中添加页面配置
4. 使用路由工具进行页面跳转 