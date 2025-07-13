// utils/sessionHelper.js
// Session管理辅助函数

import sessionManager from './sessionManagers.js'

/**
 * 处理API响应中的session保存
 * @param {Object} res - API响应对象
 * @param {Object} store - store实例（可选）
 */
export function handleSessionFromResponse(res, store = null) {
  if (res.header && res.header['Set-Cookie']) {
    const newSession = sessionManager.extractSessionId(res.header['Set-Cookie'])
    if (newSession) {
      // 保存到本地存储
      sessionManager.saveSession(newSession)
      
      // 如果提供了store，更新store中的sessionId
      if (store && store.state) {
        store.state.sessionId = newSession
      }
      
      console.log('Session已更新:', newSession)
      return newSession
    }
  }
  return null
}

/**
 * 清除session
 * @param {Object} store - store实例（可选）
 */
export function clearSession(store = null) {
  // 清除本地存储
  sessionManager.clearSession()
  
  // 如果提供了store，清除store中的session相关状态
  if (store && store.state) {
    store.state.isLoggedIn = false
    store.state.userInfo = null
    store.state.sessionId = ''
  }
  
  console.log('Session已清除')
}

/**
 * 获取当前session状态
 * @param {Object} store - store实例（可选）
 * @returns {Object} session状态信息
 */
export function getSessionStatus(store = null) {
  const sessionId = sessionManager.getSession()
  const isLoggedIn = !!sessionId
  
  return {
    sessionId,
    isLoggedIn,
    hasUserInfo: store && store.state && store.state.userInfo
  }
} 