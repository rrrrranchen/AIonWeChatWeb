// pages/courseDetail/courseDetail.js
import { API_ENDPOINTS, getHeaders, handleApiError } from '../../utils/api'
import sessionManager from '../../utils/sessionManagers'

Page({
  data: {
    loading: true,
    error: null,
    courses: [],
    courseClassId: null,
     currentTab: 1,
    courseClassInfo: {
      name: '加载中...',
      description: '',
      image_path: ''
    }
  },

  onLoad(options) {
    if (!options.id) {
      this.handleError('缺少课程班ID参数')
      return
    }
    this.setData({ courseClassId: options.id })
    this.loadCourseClassData()
  },

  async loadCourseClassData() {
    this.setData({ loading: true, error: null })
    wx.showLoading({ title: '加载中...', mask: true })
    
    try {
      const classRes = await sessionManager.requestWithSession({
        url: API_ENDPOINTS.COURSE_CLASS_DETAIL(this.data.courseClassId),
        method: 'GET',
        header: getHeaders()
      })

      const processedTeachers = classRes.data.teachers.map(teacher => ({
        ...teacher,
        avatar: this.formatAvatarUrl(teacher.avatar) // 处理头像路径
      }))

      const coursesRes = await sessionManager.requestWithSession({
        url: API_ENDPOINTS.COURSE_CLASS_COURSES(this.data.courseClassId),
        method: 'GET',
        header: getHeaders()
      })
      const rawPath = classRes.data.image_path;
      let finalImageUrl = '/images/default-course.png'; // 修改默认图片
      
      if (rawPath) {
        if (rawPath.startsWith('http')) {
          finalImageUrl = rawPath;
        } else {
          const normalizedPath = rawPath.replace(/\\/g, '/');
          finalImageUrl = `http://localhost:5000/static/${normalizedPath.replace(/^static\/?/, '')}`;
        }
      }
  
      this.setData({
        courseClassInfo: {
          ...classRes.data,
         teachers: processedTeachers
        },
        courses: coursesRes.data || [],
        loading: false
      });
  
      console.log('课程封面路径已处理:', finalImageUrl); // 调试用
  
    } catch (error) {
      console.error('加载课程班数据失败:', error)
      this.handleError(error)
    } finally {
      wx.hideLoading()
    }
  },
  formatAvatarUrl(rawPath) {
    if (!rawPath) return '/images/default-avatar.png' // 默认头像
    
    if (rawPath.startsWith('http')) {
      return rawPath // 已经是完整URL
    }
    
    // 处理路径格式并拼接基础URL
    const normalizedPath = rawPath.replace(/\\/g, '/')
    return `http://localhost:5000/static/${normalizedPath.replace(/^static\/?/, '')}`
  },
  switchTab(e) {
    const tabIndex = parseInt(e.detail.tabIndex, 10);
    if (!isNaN(tabIndex)) {
      // 使用reLaunch而不是switchTab，这样可以保持homePage的tab状态
      wx.reLaunch({
        url: `/pages/homePage/homePage?targetTab=${tabIndex}`
      });
    } else {
      console.error('Invalid tab index received:', e.detail.tabIndex);
    }
  },
  navigateBack() {
    wx.navigateBack({
      delta: 1
    });
  },

  handleError(error) {
    let errorMsg = '加载失败'
    
    if (error.statusCode === 403) {
      errorMsg = '您没有权限查看此课程班'
    } else if (error.statusCode === 404) {
      errorMsg = '课程班不存在'
    } else if (error.errMsg) {
      errorMsg = error.errMsg
    } else if (error.data?.error) {
      errorMsg = error.data.error
    }
    
    this.setData({
      loading: false,
      error: errorMsg
    })
    
    wx.showToast({
      title: errorMsg,
      icon: 'none',
      duration: 2000
    })
  },

  onRetry() {
    this.loadCourseClassData()
  },

  // 跳转到课程详情
  navigateToCourse(e) {
    const courseId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/courseDetail/courseDetail?id=${courseId}`
    })
  }
})
