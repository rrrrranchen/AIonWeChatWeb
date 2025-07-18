import { API_ENDPOINTS, getHeaders, handleApiError } from '../../utils/api.js';
import { handleSessionFromResponse } from '../../utils/sessionHelper.js';
import sessionManager from '../../utils/sessionManagers.js';
function debounce(func, wait) {
    let timeout;
    return function(...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        func.apply(context, args);
      }, wait);
    };
  }
const app = getApp();

Page({
  data: {
    userInfo: null,
    classOptions: [],
    selectedClass: null,
    conversationOptions: [],
    currentConversation: null,
    thinkingMode: false,
    currentTab: 0,
    processedConvOptions: {},
    messages: [
      {
        id: 0,
        role: 'assistant',
        content: '你好！我是你的AI学习助手，请选择班级和会话后开始提问。',
        thinkingContent: '',
        sources: null
      }
    ],
    inputMessage: '',
    isLoading: false,
    loadingConversations: false,
    thinkingExpanded: {},
    sourcesExpanded: {},
    isStreaming: false,
    streamingContent: '',
    streamingThinkingContent: '',
    streamingSources: null
  },

  onLoad() {
    this.setData({
      userInfo: app.globalData.store.state.userInfo
    });
    this.loadClasses();
  },

  async loadClasses() {
    try {
      const res = await sessionManager.requestWithSession({
        url: API_ENDPOINTS.COURSES,
        method: 'GET',
        header: getHeaders()
      });

      if (res.statusCode === 200) {
        handleSessionFromResponse(res, app.globalData.store);
        this.setData({
          classOptions: res.data.map(course => ({
            id: course.id,
            name: course.name
          }))
        });
      }
    } catch (error) {
      handleApiError(error, 'COURSES');
    }
  },

  async loadConversations() {
    if (!this.data.selectedClass) return;
    
    this.setData({ loadingConversations: true });
    
    try {
      const res = await sessionManager.requestWithSession({
        url: `${API_ENDPOINTS.COURSE_CLASS_CONVERSATIONS}/${this.data.selectedClass.id}`,
        method: 'GET',
        header: getHeaders()
      });

      if (res.statusCode === 200) {
        handleSessionFromResponse(res, app.globalData.store);
        const conversations = res.data.map(conv => ({
          id: conv.id,
          name: conv.name,
          createdAt: conv.created_at
        }));
        
        this.setData({
          conversationOptions: conversations
        });
        
        // 默认选择最新的会话
        if (conversations.length > 0) {
          this.setData({
            currentConversation: conversations[0].id
          });
          await this.loadConversationMessages(conversations[0].id);
        }
      }
    } catch (error) {
      handleApiError(error, 'CONVERSATIONS');
      wx.showToast({
        title: '加载会话失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loadingConversations: false });
    }
  },

  async loadConversationMessages(conversationId) {
    try {
      const res = await sessionManager.requestWithSession({
        url: `${API_ENDPOINTS.CONVERSATION_DETAIL}/${conversationId}`,
        method: 'GET',
        header: getHeaders()
      });

      if (res.statusCode === 200) {
        handleSessionFromResponse(res, app.globalData.store);
        const messages = res.data.messages || [];
        
        // 初始化展开状态
        const thinkingExpanded = {};
        const sourcesExpanded = {};
        
        messages.forEach(msg => {
          if (msg.id) {
            thinkingExpanded[msg.id] = false;
            sourcesExpanded[msg.id] = false;
          }
        });

        this.setData({
          messages: messages.map(msg => ({
            ...msg,
            content: this.formatMarkdown(msg.content),
            thinkingContent: this.formatMarkdown(msg.thinkingContent || '')
          })),
          thinkingExpanded,
          sourcesExpanded
        });
        
        this.scrollToBottom();
      }
    } catch (error) {
      handleApiError(error, 'CONVERSATION_DETAIL');
      wx.showToast({
        title: '加载消息失败',
        icon: 'none'
      });
    }
  },

  handleClassChange(e) {
    const index = e.detail.value;
    const selectedClass = this.data.classOptions[index];
    this.setData({
      selectedClass,
      currentConversation: null,
      messages: [{
        id: 0,
        role: 'assistant',
        content: `已选择班级: ${selectedClass.name}，请选择或创建会话`,
        thinkingContent: '',
        sources: null
      }],
      conversationOptions: []
    }, () => {
      this.loadConversations();
    });
  },
  processConversations: function() {
    const map = {};
    this.data.conversationOptions.forEach(item => {
      map[item.id] = item.name;
    });
    this.setData({ processedConvOptions: map });
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
  // 使用时
  getCurrentConvName: function() {
    return this.data.processedConvOptions[this.data.currentConversation] || '请选择会话';
  },
  handleConversationChange(e) {
    const index = e.detail.value;
    const conversation = this.data.conversationOptions[index];
    this.setData({
      currentConversation: conversation.id
    }, () => {
      this.loadConversationMessages(conversation.id);
    });
  },

  async createNewConversation() {
    if (!this.data.selectedClass) {
      wx.showToast({
        title: '请先选择班级',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '创建会话中...',
      mask: true
    });

    try {
      const res = await sessionManager.requestWithSession({
        url: `${API_ENDPOINTS.CREATE_CONVERSATION}/${this.data.selectedClass.id}`,
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          ...getHeaders()
        },
        data: {
          courseclass_id: this.data.selectedClass.id
        }
      });

      if (res.statusCode === 201) {
        handleSessionFromResponse(res, app.globalData.store);
        await this.loadConversations();
        wx.showToast({
          title: '新会话创建成功',
          icon: 'success'
        });
      }
    } catch (error) {
      handleApiError(error, 'CREATE_CONVERSATION');
      wx.showToast({
        title: '创建会话失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  toggleThinkingMode(e) {
    this.setData({
      thinkingMode: e.detail.value
    });
  },

  handleInput(e) {
    this.setData({
      inputMessage: e.detail.value
    });
  },

  toggleThinking(e) {
    const id = e.currentTarget.dataset.id;
    const { thinkingExpanded } = this.data;
    this.setData({
      thinkingExpanded: {
        ...thinkingExpanded,
        [id]: !thinkingExpanded[id]
      }
    });
  },

  toggleSources(e) {
    const id = e.currentTarget.dataset.id;
    const { sourcesExpanded } = this.data;
    this.setData({
      sourcesExpanded: {
        ...sourcesExpanded,
        [id]: !sourcesExpanded[id]
      }
    });
  },

  sendMessage() {
    if (!this.data.inputMessage?.trim()) {
      wx.showToast({
        title: '请输入消息内容',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    if (!this.data.currentConversation) {
      wx.showToast({
        title: '请先选择会话',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    if (this.data.isLoading) {
      wx.showToast({
        title: '请等待当前请求完成',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 创建用户消息
    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: this.data.inputMessage
    };

    // 更新UI
    this.setData({
      messages: [...this.data.messages, userMsg],
      inputMessage: '',
      isLoading: true,
      isStreaming: true,
      streamingContent: '',
      streamingThinkingContent: '',
      streamingSources: null
    });

    this.scrollToBottom();

    // 发送HTTP请求
    this.sendChatRequest(userMsg);
  },

  async sendChatRequest(userMsg) {
  const tempMsgId = Date.now();
  
  try {
    const requestData = {
      query: userMsg.content,
      thinking_mode: this.data.thinkingMode,
      history: this.getCompactHistory()
    };

    // 创建临时消息占位（添加streamingContent字段）
    this.setData({
      messages: [...this.data.messages, {
        id: tempMsgId,
        role: 'assistant',
        content: '',
        streamingContent: '▌', // 单独管理流式内容
        thinkingContent: '',
        isStreaming: true
      }],
      isLoading: true
    });

    const requestTask = wx.request({
      url: `${API_ENDPOINTS.COURSE_CLASS_CHAT}/${this.data.currentConversation}`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        ...getHeaders()
      },
      data: requestData,
      responseType: 'text',
      enableChunked: true,
      success: (res) => {
        if (res.statusCode !== 200) {
          throw new Error(`请求失败，状态码: ${res.statusCode}`);
        }
      },
      fail: (err) => {
        throw new Error(err.errMsg || '网络请求失败');
      }
    });

    let buffer = '';
    requestTask.onChunkReceived((res) => {
        try {
          buffer += res.data;
          
          // 改进的分割逻辑
          const chunks = buffer.split(/(?<=})\s*(?=data:)/);
          buffer = chunks.pop() || '';
          
          chunks.forEach(rawChunk => {
            const chunk = rawChunk.trim();
            if (!chunk.startsWith('data:')) return;
            
            try {
              const data = JSON.parse(chunk.replace(/^data:\s*/, ''));
              
              // 立即更新UI（移除防抖）
              const messages = this.data.messages;
              const lastMsgIndex = messages.length - 1;
              
              if (data.content) {
                messages[lastMsgIndex].content = 
                  (messages[lastMsgIndex].content || '').replace(/▌/g, '') + data.content + '▌';
              }
              
              this.setData({
                messages: messages
              });
              
              if (data.status === 'end') {
                this.finalizeMessage(tempMsgId, {
                  content: data.content || '',
                  sources: data.sources
                });
              }
              
              this.scrollToBottom();
            } catch (e) {
              console.error('解析数据块失败:', chunk);
            }
          });
        } catch (error) {
          this.handleStreamError(tempMsgId, error);
        }
      });

    } catch (error) {
        this.handleStreamError(tempMsgId, error);
    }
  },
  
  // 新增辅助方法
  updateStreamingContent(msgId, content) {
    const current = this.getCurrentMessage(msgId);
    this.setData({
      messages: this.data.messages.map(msg => 
        msg.id === msgId ? { 
          ...msg, 
          content: (msg.content === '▌' ? '' : msg.content) + content 
        } : msg
      )
    });
  },
  
  updateThinkingContent(msgId, content) {
    this.setData({
      messages: this.data.messages.map(msg => 
        msg.id === msgId ? { 
          ...msg, 
          thinkingContent: (msg.thinkingContent || '') + content 
        } : msg
      )
    });
  },
  
  finalizeMessage(msgId, { content, sources }) {
    this.setData({
      messages: this.data.messages.map(msg => 
        msg.id === msgId ? { 
          ...msg, 
          content: this.formatMarkdown(content || msg.content.replace(/▌/g, '')),
          sources: sources,
          isStreaming: false
        } : msg
      ),
      isStreaming: false,
      isLoading: false
    });
  },
  
  getCurrentMessage(msgId) {
    return this.data.messages.find(msg => msg.id === msgId);
  },
  
  getCurrentContent(msgId) {
    const msg = this.getCurrentMessage(msgId);
    return msg ? msg.content : '';
  },
  
  handleStreamError(tempMsgId, error) {
    console.error('流式请求错误:', error);
    
    // 安全移除临时消息
    const newMessages = this.data.messages.filter(msg => 
      msg.id !== tempMsgId
    );
    
    this.setData({
      messages: newMessages,
      isLoading: false
    }, () => {
      this.addAssistantMessage(
        `请求出错: ${error.message}`,
        false,
        '',
        null
      );
    });
  },

  getCompactHistory() {
    return this.data.messages
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));
  },

  handleChatResponse(data) {
    let content = '';
    let thinkingContent = '';
    let sources = null;

    // 处理响应数据
    if (data.status === 'end') {
      content = data.content || '';
      sources = data.sources || null;
    } else if (data.status === 'content') {
      content = data.content || '';
    } else if (data.status === 'reasoning') {
      thinkingContent = data.content || '';
    }

    // 查找或创建助手消息
    const lastMsg = this.data.messages[this.data.messages.length - 1];
    if (lastMsg.role === 'assistant' && this.data.isStreaming) {
      // 更新现有消息
      this.setData({
        messages: this.data.messages.map(msg => {
          if (msg.id === lastMsg.id) {
            return {
              ...msg,
              content: msg.content + (content || ''),
              thinkingContent: msg.thinkingContent + (thinkingContent || ''),
              sources: sources || msg.sources,
              isStreaming: data.status !== 'end'
            };
          }
          return msg;
        }),
        streamingContent: content,
        streamingThinkingContent: thinkingContent,
        streamingSources: sources
      });
    } else {
      // 创建新消息
      this.addAssistantMessage(
        content,
        this.data.thinkingMode,
        thinkingContent,
        sources,
        data.status !== 'end'
      );
    }

    this.scrollToBottom();
  },
    
  
  addAssistantMessage(content, thinkingMode, thinkingContent, sources, isStreaming = false) {
    const newMsg = {
        id: Date.now(),
        role: 'assistant',
        content: isStreaming ? '' : this.formatMarkdown(content),
        streamingContent: isStreaming ? '▌' : null, // 流式内容单独存储
        thinkingContent: this.formatMarkdown(thinkingContent),
        sources,
        isStreaming
      };
    const getSafeText = (chunk) => {
        try {
        return chunk?.text ? String(chunk.text) : '内容不可用';
        } catch {
        return '内容解析错误';
        }
    };
    const safeSources = sources ? {
        ...sources,
        sources: (sources.sources || []).map(src => ({
          ...src,
          chunks: (src.chunks || []).map(chunk => ({
            text: getSafeText(chunk),
            position: chunk.position || 0
          }))
        }))
      } : null;
    
    this.setData({
      messages: [...this.data.messages, newMsg],
      thinkingExpanded: {
        ...this.data.thinkingExpanded,
        [newMsg.id]: false
      },
      sourcesExpanded: {
        ...this.data.sourcesExpanded,
        [newMsg.id]: false
      },
      streamingContent: '',
      streamingThinkingContent: '',
      streamingSources: null
    });
  },

  formatMarkdown(text) {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br/>');
  },

  scrollToBottom() {
    setTimeout(() => {
      this.setData({
        scrollTop: 99999
      });
    }, 100);
  },
  updateStreamingMessage(msgId, updates) {
    this.setData({
        messages: this.data.messages.map(msg => 
            msg.id === msgId ? { ...msg, ...updates } : msg
        )
    });
},

// 最终确定消息
finalizeMessage(msgId, content) {
    this.setData({
        messages: this.data.messages.map(msg => 
            msg.id === msgId ? { 
                ...msg, 
                ...content,
                isStreaming: false,
                content: this.formatMarkdown(content.content),
                thinkingContent: this.formatMarkdown(content.thinkingContent)
            } : msg
        ),
        isStreaming: false
    });
},

// 错误处理
handleStreamError(tempMsgId, error) {
    console.error('流式请求错误:', error);
    
    // 移除临时消息（如果存在）
    const newMessages = this.data.messages.filter(msg => msg.id !== tempMsgId);
    
    this.setData({
      messages: newMessages,
      isLoading: false
    }, () => {
      // 添加错误提示消息
      this.addAssistantMessage(
        `请求出错: ${error.message}`,
        false,
        '',
        null
      );
    });
  },
  formatStreamingContent(content) {
    if (!content) return '';
    // 移除可能存在的重复标记
    return this.formatMarkdown(content.replace(/^▌+|▌+$/g, ''));
  },
  
  // 更新流式内容（防抖处理）
  updateStreamingContent: debounce(function(msgId, content) {
    this.setData({
      messages: this.data.messages.map(msg => 
        msg.id === msgId ? { 
          ...msg, 
          content: (msg.content === '▌' ? '' : msg.content.replace(/▌/g, '')) + content + '▌'
        } : msg
      )
    });
  }, 100),
  
  // 更新思考内容（防抖处理）
  updateThinkingContent: debounce(function(msgId, content) {
    this.setData({
      messages: this.data.messages.map(msg => 
        msg.id === msgId ? { 
          ...msg, 
          thinkingContent: (msg.thinkingContent || '') + content 
        } : msg
      )
    });
  }, 100),
});
