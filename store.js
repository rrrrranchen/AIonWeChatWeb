// store.js
import sessionManager from './utils/sessionManagers.js'
import { API_ENDPOINTS, getHeaders, handleApiError } from './utils/api.js'
import { handleSessionFromResponse, clearSession } from './utils/sessionHelper.js'

const store = {
  state: {
    isLoggedIn: false,
    userInfo: null,
    sessionId: ''
  },
  
  // 初始化状态
  init() {
    this.state.sessionId = sessionManager.getSession()
    this.state.isLoggedIn = !!this.state.sessionId
    if (this.state.isLoggedIn) {
      this.fetchUserProfile()
    }
  },
  
  // 登录处理
  async login(loginData) {
    try {
      const res = await sessionManager.requestWithSession({
        url: API_ENDPOINTS.LOGIN,
        method: 'POST',
        data: loginData,
        header: getHeaders()
      })
      
      if (res.statusCode === 200) {
        // 手动保存session
        handleSessionFromResponse(res, this)
        
        this.state.isLoggedIn = true
        await this.fetchUserProfile()
        return true
      }
      return false
    } catch (error) {
      handleApiError(error, 'LOGIN')
      return false
    }
  },
  
  // 获取用户信息
  async fetchUserProfile() {
    try {
      const res = await sessionManager.requestWithSession({
        url: API_ENDPOINTS.HOME,
        method: 'GET'
      })
      
      if (res.statusCode === 200) {
        // 手动保存session（如果后端返回新的session）
        handleSessionFromResponse(res, this)
        
        this.state.userInfo = res.data
        return true
      }
      return false
    } catch (error) {
      handleApiError(error, 'HOME')
      return false
    }
  },
  
  // 更新用户信息
  async updateProfile(updateData) {
    try {
      const res = await sessionManager.requestWithSession({
        url: API_ENDPOINTS.UPDATE_PROFILE,
        method: 'PUT',
        data: updateData,
        header: getHeaders()
      })
      
      if (res.statusCode === 200) {
        // 手动保存session（如果后端返回新的session）
        handleSessionFromResponse(res, this)
        
        await this.fetchUserProfile()
        return true
      }
      return false
    } catch (error) {
      handleApiError(error, 'UPDATE_PROFILE')
      return false
    }
  },
  
  // 更新头像
  async updateAvatar(filePath) {
    try {
      const res = await new Promise((resolve, reject) => {
        wx.uploadFile({
          url: API_ENDPOINTS.UPDATE_AVATAR,
          filePath,
          name: 'avatar',
          header: {
            'Cookie': `session=${sessionManager.getSession()}`
          },
          success: resolve,
          fail: reject
        })
      })
      
      if (res.statusCode === 200) {
        // 手动保存session（如果后端返回新的session）
        handleSessionFromResponse(res, this)
        
        const data = JSON.parse(res.data)
        if (data.avatar) {
          this.state.userInfo.avatar = data.avatar
        }
        return true
      }
      return false
    } catch (error) {
      handleApiError(error, 'UPDATE_AVATAR')
      return false
    }
  },
  
  // 注销处理
  async logout() {
    try {
      const res = await sessionManager.requestWithSession({
        url: API_ENDPOINTS.LOGOUT,
        method: 'POST'
      })
      
      if (res.statusCode === 200) {
        // 注销时清除session
        clearSession(this)
        return true
      }
      return false
    } catch (error) {
      handleApiError(error, 'LOGOUT')
      return false
    }
  }
}

// 初始化状态
store.init()

export default store