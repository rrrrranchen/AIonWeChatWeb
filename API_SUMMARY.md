# API路径总结

## 基础信息
- **后端地址**: `http://localhost:5000`
- **认证方式**: Session Cookie

## API端点列表

### 用户认证
- `POST /login` - 用户登录
- `POST /logout` - 用户注销

### 用户信息
- `GET /home` - 获取用户信息
- `PUT /home/update` - 更新用户信息
- `POST /home/avatar` - 更新用户头像

### 课程管理
- `GET /courseclasses` - 获取课程列表
- `GET /courseclasses/{id}` - 获取课程详情
- `PUT /courseclasses/{id}/progress` - 更新课程进度

## 更新说明
✅ 已将课程相关API路径从 `/courses` 更新为 `/courseclasses` 