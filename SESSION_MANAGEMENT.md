# Session管理说明

## 概述

本项目实现了完整的Session管理机制，确保用户登录状态的持久化和安全性。

## 文件结构

### 核心文件
- `utils/sessionManagers.js` - Session管理核心功能
- `utils/sessionHelper.js` - Session操作辅助函数
- `store.js` - 全局状态管理，包含Session状态

## Session管理流程

### 1. 登录流程
```javascript
// 用户登录
const success = await store.login({ username, password })
if (success) {
  // 登录成功，Session已自动保存
  console.log('登录成功，Session已保存')
}
```

### 2. Session保存机制
每个API接口都会自动处理Session的保存：

```javascript
// 在API响应中自动检测并保存Session
if (res.header && res.header['Set-Cookie']) {
  const newSession = sessionManager.extractSessionId(res.header['Set-Cookie'])
  if (newSession) {
    sessionManager.saveSession(newSession)  // 保存到本地存储
    store.state.sessionId = newSession     // 更新store状态
  }
}
```

### 3. Session清除机制
```javascript
// 用户注销时清除Session
await store.logout()
// Session已自动清除
```

## API接口Session处理

### 已实现Session处理的接口

| 接口 | 方法 | 路径 | Session处理 |
|------|------|------|-------------|
| 用户登录 | POST | `/login` | ✅ 自动保存Session |
| 获取用户信息 | GET | `/home` | ✅ 自动保存Session |
| 更新用户信息 | PUT | `/home/update` | ✅ 自动保存Session |
| 更新头像 | POST | `/home/avatar` | ✅ 自动保存Session |
| 获取课程列表 | GET | `/courseclasses` | ✅ 自动保存Session |
| 用户注销 | POST | `/logout` | ✅ 自动清除Session |

### Session处理逻辑

1. **登录接口** (`/login`)
   - 登录成功后自动保存Session
   - 更新store中的登录状态

2. **需要认证的接口**
   - 自动在请求头中携带Session Cookie
   - 响应中如果包含新的Session，自动更新

3. **注销接口** (`/logout`)
   - 清除本地存储的Session
   - 重置store中的登录状态

## 辅助函数

### `handleSessionFromResponse(res, store)`
处理API响应中的Session保存：
```javascript
import { handleSessionFromResponse } from './utils/sessionHelper.js'

// 在API响应处理中使用
if (res.statusCode === 200) {
  handleSessionFromResponse(res, store)
  // Session已自动处理
}
```

### `clearSession(store)`
清除Session：
```javascript
import { clearSession } from './utils/sessionHelper.js'

// 注销时使用
clearSession(store)
// Session已清除
```

### `getSessionStatus(store)`
获取Session状态：
```javascript
import { getSessionStatus } from './utils/sessionHelper.js'

const status = getSessionStatus(store)
console.log('Session状态:', status)
// 输出: { sessionId: 'xxx', isLoggedIn: true, hasUserInfo: true }
```

## 后端要求

### Session Cookie格式
后端需要设置Session Cookie，格式如下：
```
Set-Cookie: session=<session_id>; Path=/; HttpOnly
```

### 响应头要求
所有需要更新Session的接口都应该在响应头中包含：
```
Set-Cookie: session=<new_session_id>
```

## 安全考虑

1. **Session存储**: 使用微信小程序的本地存储
2. **自动更新**: 每次API调用都会检查并更新Session
3. **自动清除**: 注销时自动清除所有Session信息
4. **错误处理**: 网络错误时不影响Session状态

## 调试信息

Session操作会在控制台输出调试信息：
- `Session已更新: <session_id>` - Session更新时
- `Session已清除` - Session清除时

## 注意事项

1. **跨域请求**: 确保后端配置了正确的CORS设置
2. **Cookie处理**: 微信小程序会自动处理Cookie的发送和接收
3. **存储限制**: 本地存储有大小限制，Session ID应该保持简短
4. **网络异常**: 网络异常时Session状态不会丢失 