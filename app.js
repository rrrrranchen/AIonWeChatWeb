// app.js
import store from './store.js'

App({
  globalData: {
    store
  },
  
  onLaunch() {
    // 检查登录状态
    if (store.state.isLoggedIn && !store.state.userInfo) {
      store.fetchUserProfile()
    }
  }
})