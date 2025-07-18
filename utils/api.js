// utils/api.js
// API配置文件

const API_BASE_URL = 'http://localhost:5000'

export const API_ENDPOINTS = {
  // 认证相关
  LOGIN: `${API_BASE_URL}/login`,
  LOGOUT: `${API_BASE_URL}/logout`,
  
  // 用户相关
  HOME: `${API_BASE_URL}/profile`,
  UPDATE_PROFILE: `${API_BASE_URL}/profile/update`,
  UPDATE_AVATAR: `${API_BASE_URL}/profile/update_avatar`,
  GET_AVATAR:(id)=>`${API_BASE_URL}/avatar/${id}`,
  // 课程相关
  COURSES: `${API_BASE_URL}/courseclasses`,
  COURSE_CLASS_DETAIL: (id) => `${API_BASE_URL}/courseclasses/${id}`,
  COURSE_CLASS_COURSES: (id) => `${API_BASE_URL}/courseclasses/${id}/courses`,
  COURSE_CLASS_CONVERSATIONS: `${API_BASE_URL}/course_class_conversations`,
  CONVERSATION_DETAIL: `${API_BASE_URL}/conversation_detail`,
  CREATE_CONVERSATION: `${API_BASE_URL}/create_conversation`,
  COURSE_CLASS_CHAT: `${API_BASE_URL}/course_class_chat`,
  RECOMMEND_COURSES: `${API_BASE_URL}/courseclass/recommend_courseclasses`,
}

// API请求配置
export const API_CONFIG = {
  TIMEOUT: 10000, // 10秒超时
  RETRY_TIMES: 3, // 重试次数
}

// 请求头配置
export const getHeaders = (customHeaders = {}) => {
  return {
    'Content-Type': 'application/json',
    ...customHeaders
    
  }
}

// 错误处理
export const handleApiError = (error, endpoint) => {
  console.error(`API请求失败 [${endpoint}]:`, error)
  
  if (error.statusCode) {
    switch (error.statusCode) {
      case 401:
        wx.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
        break
      case 403:
        wx.showToast({ title: '没有权限访问', icon: 'none' })
        break
      case 404:
        wx.showToast({ title: '请求的资源不存在', icon: 'none' })
        break
      case 500:
        wx.showToast({ title: '服务器内部错误', icon: 'none' })
        break
      default:
        wx.showToast({ title: '网络请求失败', icon: 'none' })
    }
  } else {
    wx.showToast({ title: '网络连接失败', icon: 'none' })
  }
} 