// utils/router.js
// 路由管理工具

// 构建查询字符串
function buildQueryString(params) {
  if (!params || Object.keys(params).length === 0) {
    return ''
  }
  return Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&')
}

// 页面路由配置
export const pages = {
  homePage: '/pages/homePage/homePage',  // 首页
  login: '/pages/login/login'
}

// 跳转方法
export function navigateTo(url, params = {}) {
  const queryString = buildQueryString(params)
  const fullUrl = queryString ? `${url}?${queryString}` : url
  wx.navigateTo({ url: fullUrl })
}

export function redirectTo(url, params = {}) {
  const queryString = buildQueryString(params)
  const fullUrl = queryString ? `${url}?${queryString}` : url
  wx.redirectTo({ url: fullUrl })
}

export function switchTab(url) {
  wx.switchTab({ url })
}

export function reLaunch(url, params = {}) {
  const queryString = buildQueryString(params)
  const fullUrl = queryString ? `${url}?${queryString}` : url
  wx.reLaunch({ url: fullUrl })
}

export function navigateBack(delta = 1) {
  wx.navigateBack({ delta })
}

// 解析页面参数
export function parseParams(options) {
  return options || {}
}

// 导出默认对象（保持向后兼容）
const routes = {
  pages,
  navigateTo,
  redirectTo,
  switchTab,
  reLaunch,
  navigateBack,
  parseParams,
  buildQueryString
}

export default routes
  