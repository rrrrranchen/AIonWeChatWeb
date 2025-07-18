// pages/homePage/homePage.js
import { navigateTo, redirectTo, pages } from '../../utils/router.js'
import { API_ENDPOINTS, getHeaders, handleApiError } from '../../utils/api.js'
import { handleSessionFromResponse } from '../../utils/sessionHelper.js'
import sessionManager from '../../utils/sessionManagers.js'

const app = getApp()

Page({
  data: {
    currentTab: 0,
    userInfo: {id: null,
        name: '',
        avatar: '',
        email: '',},
    courseList: [],
    recommendedCourses: []
  },
  switchTab(e) {
    const tabIndex = parseInt(e.detail.tabIndex, 10); // 确保从事件参数中正确获取
    if (!isNaN(tabIndex)) {
      this.setData({
        currentTab: tabIndex
      });
    } else {
      console.error('Invalid tab index received:', e.detail.tabIndex);
      this.setData({ currentTab: 0 }); // 提供默认值
    }
  },
  onSwiperChange(e) {
    this.setData({
      currentTab: e.detail.current
    });
  },
  onLoad(options) {
    // 解析页面参数
    console.log('主页参数:', options)
    this.loadCourseList(),
    this.loadRecommendedCourses(); 
  },
  
  onShow() {
    this.setData({
      userInfo: app.globalData.store.state.userInfo
    })
    // 每次显示页面时刷新课程列表
    this.loadUserAvatar();
    this.loadCourseList();
    this.loadRecommendedCourses();
  },
  async loadRecommendedCourses() {
    try {
      const res = await sessionManager.requestWithSession({
        url: API_ENDPOINTS.RECOMMEND_COURSES,
        method: 'GET',
        header: getHeaders(),
        timeout: 10000
      });
      
      if (res.statusCode === 200) {
        handleSessionFromResponse(res, app.globalData.store);
        this.setData({
          recommendedCourses: Array.isArray(res.data) ? res.data : []
        });
      } else {
        throw new Error(`HTTP ${res.statusCode}`);
      }
    } catch (error) {
      handleApiError(error, 'RECOMMEND_COURSES');
      // 使用模拟数据
      this.setData({
        recommendedCourses: [
          {
            id: 4,
            name: 'Python数据分析',
            description: '学习使用Python进行数据分析',
            reason: '热门课程'
          },
          {
            id: 5,
            name: 'React前端开发',
            description: '掌握React框架开发技能',
            reason: '根据你的学习历史推荐'
          }
        ]
      });
    }
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
            courseList: Array.isArray(res.data) ? res.data : []  // 直接使用数组
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
  goToCourseDetail(e) {
    const courseclassId = e.currentTarget.dataset.courseId
    wx.navigateTo({
      url: `/pages/courseDetail/courseDetail?id=${courseclassId}`
    })
  },
  goToAIAssistant() {
    if (!this.data.userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    wx.navigateTo({
      url: '/pages/aiAssistant/aiAssistant'
    });
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
  },
  async loadUserAvatar() {
    if (!this.data.userInfo?.id) return;
  
    try {
      const res = await sessionManager.requestWithSession({
        url: API_ENDPOINTS.GET_AVATAR(this.data.userInfo.id),
        method: 'GET'
      });
  
      if (res.statusCode === 200) {
        // 关键处理：转换后端返回的反斜杠路径为合法URL
        const rawPath = res.data.avatar; // 可能是 "static\uploads\avatar\xxx.png"
        let finalUrl = '/images/default-avatar.png'; // 默认值
  
        if (rawPath) {
          if (rawPath.startsWith('http')) {
            // 情况1：已经是完整URL -> 直接使用
            finalUrl = rawPath;
          } else {
            // 情况2：处理Windows反斜杠路径
            const normalizedPath = rawPath.replace(/\\/g, '/'); // 替换所有反斜杠为正斜杠
            // 拼接完整URL（假设静态资源通过/static/路由暴露）
            finalUrl = `http://localhost:5000/static/${normalizedPath.replace(/^static\/?/, '')}`;
          }
        }
  
        // 更新数据
        this.setData({
          userInfo: {
            ...this.data.userInfo,
            avatar: finalUrl
          }
        });
  
        // 调试日志（发布时可移除）
        console.log('头像路径处理结果:', {
          original: rawPath,
          final: finalUrl
        });
      }
    } catch (error) {
      console.error('加载头像失败:', error);
      this.setData({
        userInfo: {
          ...this.data.userInfo,
          avatar: '/images/default-avatar.png'
        }
      });
    }
  }
})