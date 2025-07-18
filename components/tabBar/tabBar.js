// components/tabBar/tabBar.js
Component({
    properties: {
      currentTab: {
        type: Number,
        value: 0,
        observer(newVal) {
          // 双重验证
          if (typeof newVal !== 'number' || isNaN(newVal)) {
            this.setData({ _safeTab: 0 });
            console.error('Invalid currentTab received:', newVal);
          }
        }
      }
    },
    data: {
      _safeTab: 0
    },
    observers: {
      'currentTab': function(val) {
        const safeVal = parseInt(val, 10);
        this.setData({
          _safeTab: isNaN(safeVal) ? 0 : safeVal
        });
      }
    },
    methods: {
        // 添加这个方法
        switchTab(e) {
          const tabIndex = parseInt(e.currentTarget.dataset.tab, 10);
          if (!isNaN(tabIndex)) {
            // 触发自定义事件通知父组件
            this.triggerEvent('switch', { tabIndex });
          }
        }
      }
  });