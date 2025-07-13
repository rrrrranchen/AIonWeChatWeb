// pages/login/login.js
import { redirectTo, pages } from '../../utils/router.js'

const app = getApp()

Page({
  data: {
    username: '',
    password: ''
  },
  
  onLoad(options) {
    // 解析页面参数
    console.log('登录页面参数:', options)
  },
  
  handleInput(e) {
    this.setData({
      [e.currentTarget.dataset.field]: e.detail.value
    })
  },
  
  async handleLogin() {
    const { username, password } = this.data
    if (!username || !password) {
      wx.showToast({ title: '请输入用户名和密码', icon: 'none' })
      return
    }
    
    wx.showLoading({ title: '登录中...', mask: true })
    
    const success = await app.globalData.store.login({ username, password })
    
    wx.hideLoading()
    
    if (success) {
      wx.showToast({ title: '登录成功' })
      redirectTo(pages.homePage)
    } else {
      wx.showToast({ title: '登录失败，请重试', icon: 'none' })
    }
  }
})