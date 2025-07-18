// store.js
import sessionManager from './utils/sessionManagers.js'
import { API_ENDPOINTS, getHeaders, handleApiError } from './utils/api.js'
import { handleSessionFromResponse, clearSession } from './utils/sessionHelper.js'

const store = {
  state: {
    isLoggedIn: false,
    userInfo: null,
    sessionId: '',
    currentCourse: null,  // 当前查看的课程
    courseChapters: [],   // 课程章节
    learningReport: null, // 学习报告
    classMembers: []      // 班级成员
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
  // 获取课程详情
  async getCourseDetail(courseId) {
    try {
      const res = await sessionManager.requestWithSession({
        url: `${API_ENDPOINTS.COURSES}/${courseId}`,
        method: 'GET'
      })
      
      if (res.statusCode === 200) {
        this.state.currentCourse = res.data
        return res.data
      }
      return null
    } catch (error) {
      handleApiError(error, 'GET_COURSE_DETAIL')
      return null
    }
  },
  
  // 获取课程章节
  async getCourseChapters(courseId) {
    try {
      const res = await sessionManager.requestWithSession({
        url: `${API_ENDPOINTS.COURSES}/${courseId}/chapters`,
        method: 'GET'
      })
      
      if (res.statusCode === 200) {
        this.state.courseChapters = res.data
        return res.data
      }
      return []
    } catch (error) {
      handleApiError(error, 'GET_COURSE_CHAPTERS')
      return []
    }
  },
  
  // 获取学习报告
  async getLearningReport(courseId) {
    try {
      const res = await sessionManager.requestWithSession({
        url: `${API_ENDPOINTS.REPORTS}/${courseId}`,
        method: 'GET'
      })
      
      if (res.statusCode === 200) {
        this.state.learningReport = res.data
        return res.data
      }
      return null
    } catch (error) {
      handleApiError(error, 'GET_LEARNING_REPORT')
      return null
    }
  },
  
  // 获取班级成员
  async getClassMembers(courseId) {
    try {
      const res = await sessionManager.requestWithSession({
        url: `${API_ENDPOINTS.COURSES}/${courseId}/members`,
        method: 'GET'
      })
      
      if (res.statusCode === 200) {
        this.state.classMembers = res.data
        return res.data
      }
      return []
    } catch (error) {
      handleApiError(error, 'GET_CLASS_MEMBERS')
      return []
    }
  },
  
  // 批量获取课程相关数据
  async loadCourseData(courseId) {
    try {
      const [course, chapters, report, members] = await Promise.all([
        this.getCourseDetail(courseId),
        this.getCourseChapters(courseId),
        this.getLearningReport(courseId),
        this.getClassMembers(courseId)
      ])
      
      return {
        course,
        chapters,
        report,
        members
      }
    } catch (error) {
      handleApiError(error, 'LOAD_COURSE_DATA')
      return null
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