// utils/sessionManager.js
const SESSION_KEY = 'flask_session_id'

export default {
  // 保存 Session ID
  saveSession(sessionId) {
    try {
      wx.setStorageSync(SESSION_KEY, sessionId)
      return true
    } catch (e) {
      console.error('保存 Session 失败:', e)
      return false
    }
  },

  // 获取 Session ID
  getSession() {
    try {
      return wx.getStorageSync(SESSION_KEY) || ''
    } catch (e) {
      console.error('获取 Session 失败:', e)
      return ''
    }
  },

  // 清除 Session
  clearSession() {
    try {
      wx.removeStorageSync(SESSION_KEY)
      return true
    } catch (e) {
      console.error('清除 Session 失败:', e)
      return false
    }
  },

  // 封装带 Session 的请求
  requestWithSession(options) {
    const sessionId = this.getSession()
    const header = {
      ...(options.header || {}),
      'Cookie': `session=${sessionId}`
    }

    return new Promise((resolve, reject) => {
      wx.request({
        ...options,
        header,
        success: (res) => {
          // 检查是否需要更新 Session
          if (res.header['Set-Cookie']) {
            const newSession = this.extractSessionId(res.header['Set-Cookie'])
            if (newSession) this.saveSession(newSession)
          }
          resolve(res)
        },
        fail: reject
      })
    })
  },

  // 从 Set-Cookie 头中提取 Session ID
  extractSessionId(setCookieHeader) {
    if (!setCookieHeader) return null
    const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader]
    
    for (const cookie of cookies) {
      const match = cookie.match(/session=([^;]+)/)
      if (match && match[1]) return match[1]
    }
    return null
  }
}