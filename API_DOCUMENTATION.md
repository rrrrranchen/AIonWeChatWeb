# 后端API文档

## 基础信息

- **基础URL**: `http://localhost:5000`
- **内容类型**: `application/json`
- **认证方式**: Session Cookie

## 接口列表

### 1. 用户认证

#### 1.1 用户登录
- **URL**: `POST /login`
- **描述**: 用户登录接口
- **请求体**:
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "message": "登录成功",
    "data": {
      "user_id": 123,
      "username": "test_user"
    }
  }
  ```

#### 1.2 用户注销
- **URL**: `POST /logout`
- **描述**: 用户注销接口
- **请求体**: 无
- **响应**:
  ```json
  {
    "success": true,
    "message": "注销成功"
  }
  ```

### 2. 用户信息

#### 2.1 获取用户信息
- **URL**: `GET /home`
- **描述**: 获取当前登录用户的信息
- **请求体**: 无
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": 123,
      "nickName": "用户昵称",
      "avatarUrl": "头像URL",
      "email": "user@example.com",
      "created_at": "2024-01-01T00:00:00Z"
    }
  }
  ```

#### 2.2 更新用户信息
- **URL**: `PUT /home/update`
- **描述**: 更新用户信息
- **请求体**:
  ```json
  {
    "nickName": "新昵称",
    "email": "newemail@example.com"
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "message": "更新成功",
    "data": {
      "id": 123,
      "nickName": "新昵称",
      "avatarUrl": "头像URL",
      "email": "newemail@example.com"
    }
  }
  ```

#### 2.3 更新用户头像
- **URL**: `POST /home/avatar`
- **描述**: 上传并更新用户头像
- **请求体**: `multipart/form-data`
  - `avatar`: 图片文件
- **响应**:
  ```json
  {
    "success": true,
    "message": "头像更新成功",
    "data": {
      "avatarUrl": "新的头像URL"
    }
  }
  ```

### 3. 课程管理

#### 3.1 获取课程列表
- **URL**: `GET /courseclasses`
- **描述**: 获取当前用户的所有课程
- **请求体**: 无
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "courses": [
        {
          "id": 1,
          "name": "微信小程序开发",
          "description": "学习微信小程序的基础知识和开发技巧",
          "progress": 75,
          "status": "active",
          "created_at": "2024-01-01T00:00:00Z",
          "updated_at": "2024-01-01T00:00:00Z"
        },
        {
          "id": 2,
          "name": "JavaScript进阶",
          "description": "深入学习JavaScript的高级特性",
          "progress": 100,
          "status": "completed",
          "created_at": "2024-01-01T00:00:00Z",
          "updated_at": "2024-01-01T00:00:00Z"
        }
      ]
    }
  }
  ```

#### 3.2 获取课程详情
- **URL**: `GET /courseclasses/{id}`
- **描述**: 获取指定课程的详细信息
- **参数**: `id` - 课程ID
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "name": "微信小程序开发",
      "description": "学习微信小程序的基础知识和开发技巧",
      "content": "课程详细内容...",
      "progress": 75,
      "status": "active",
      "lessons": [
        {
          "id": 1,
          "title": "第一课：小程序基础",
          "duration": 30,
          "completed": true
        }
      ]
    }
  }
  ```

#### 3.3 更新课程进度
- **URL**: `PUT /courseclasses/{id}/progress`
- **描述**: 更新指定课程的学习进度
- **参数**: `id` - 课程ID
- **请求体**:
  ```json
  {
    "progress": 80
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "message": "进度更新成功",
    "data": {
      "id": 1,
      "progress": 80,
      "status": "active"
    }
  }
  ```

## 错误响应格式

所有接口在发生错误时都应返回以下格式：

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述信息"
  }
}
```

## 常见HTTP状态码

- `200`: 请求成功
- `400`: 请求参数错误
- `401`: 未授权（需要登录）
- `403`: 禁止访问
- `404`: 资源不存在
- `500`: 服务器内部错误

## 认证要求

除了登录接口外，所有其他接口都需要在请求头中包含有效的Session Cookie：

```
Cookie: session=<session_id>
```

## 开发建议

1. **CORS配置**: 确保后端允许来自微信开发者工具的跨域请求
2. **Session管理**: 实现安全的Session管理机制
3. **数据验证**: 对所有输入数据进行验证和清理
4. **错误处理**: 提供详细的错误信息和日志记录
5. **性能优化**: 考虑添加缓存和分页功能 