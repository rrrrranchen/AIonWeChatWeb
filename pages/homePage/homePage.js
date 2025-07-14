// pages/homePage/homePage.js
import { navigateTo, redirectTo, pages } from '../../utils/router.js'
import { API_ENDPOINTS, getHeaders, handleApiError } from '../../utils/api.js'
import { handleSessionFromResponse } from '../../utils/sessionHelper.js'
import sessionManager from '../../utils/sessionManagers.js'

const app = getApp()

Page({
  data: {
    userInfo: null,
    courseList: []
  },
  
  onLoad(options) {
    // 解析页面参数
    console.log('主页参数:', options)
    this.loadCourseList()
  },
  
  onShow() {
    this.setData({
      userInfo: app.globalData.store.state.userInfo
    })
    // 每次显示页面时刷新课程列表
    this.loadCourseList()
  },
  
  // 加载课程列表
  async loadCourseList() {
    try {
      const res = await sessionManager.requestWithSession({
        url: API_ENDPOINTS.COURSES,
        method: 'GET',
        header: getHeaders(),
        timeout: 10000
      })
      
      if (res.statusCode === 200) {
        // 手动保存session（如果后端返回新的session）
        handleSessionFromResponse(res, app.globalData.store)
        
        this.setData({
          courseList: res.data.courses || []
        })
      } else {
        throw new Error(`HTTP ${res.statusCode}`)
      }
    } catch (error) {
      handleApiError(error, 'COURSES')
      // 如果API调用失败，使用模拟数据
      const mockCourses = [
        {
          id: 1,
          name: '微信小程序开发',
          description: '学习微信小程序的基础知识和开发技巧',
          progress: 75,
          status: 'active'
        },
        {
          id: 2,
          name: 'JavaScript进阶',
          description: '深入学习JavaScript的高级特性',
          progress: 100,
          status: 'completed'
        },
        {
          id: 3,
          name: 'Vue.js框架',
          description: '掌握Vue.js前端框架的使用',
          progress: 30,
          status: 'active'
        }
      ]
      
      this.setData({
        courseList: mockCourses
      })
    }
  },
  
  // 跳转到课程详情
  goToCourse(e) {
    const course = e.currentTarget.dataset.course
    console.log('跳转到课程:', course)
    // 这里可以跳转到课程详情页面
    wx.showToast({ title: `进入课程: ${course.name}`, icon: 'none' })
  },
  
  // 跳转到登录页
  goToLogin() {
    navigateTo(pages.login)
  },

  async handleLogout() {
    wx.showLoading({ title: '注销中...', mask: true })
    const success = await app.globalData.store.logout()
    wx.hideLoading()
    
    if (success) {
      wx.showToast({ title: '已注销' })
      redirectTo(pages.login)
    }
  },
  
  async updateAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: async (res) => {
        const filePath = res.tempFiles[0].tempFilePath
        wx.showLoading({ title: '上传中...', mask: true })
        
        const success = await app.globalData.store.updateAvatar(filePath)
        wx.hideLoading()
        
        if (success) {
          wx.showToast({ title: '头像更新成功' })
          this.setData({ userInfo: app.globalData.store.state.userInfo })
        } else {
          wx.showToast({ title: '更新失败', icon: 'none' })
        }
      }
    })
  }
})