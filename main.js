// ========== 通用小程序智能跳转脚本 ==========
class UniversalMiniProgramNavigator {
    constructor() {
      this.wxFrame = null;
      this.config = null;
      this.allPages = [];
      this.tabBarPages = [];
      this.categorizedPages = {};
      this.menuItems = [];
      this.init();
    }
  
    // 初始化 - 自动检测小程序环境
    init() {
      if (!this.detectMiniProgramEnvironment()) {
        console.error('❌ 未检测到小程序环境！请在小程序的CDP调试环境中运行。');
        return;
      }
      
      this.loadConfiguration();
      this.categorizePages();
      this.showMenu();
    }
  
    // 自动检测小程序环境
    detectMiniProgramEnvironment() {
      console.log('🔍 正在检测小程序环境...');
  
      // 检测方法1: 直接检查全局wx对象
      if (typeof wx !== 'undefined' && typeof getCurrentPages !== 'undefined') {
        console.log('✅ 检测到小程序逻辑层环境');
        this.wxFrame = window;
        return true;
      }
  
      // 检测方法2: 检查所有frames
      if (typeof window !== 'undefined' && window.frames) {
        for (let i = 0; i < window.frames.length; i++) {
          try {
            const frame = window.frames[i];
            if (frame.wx && frame.__wxConfig) {
              console.log(`✅ 在Frame ${i}中检测到小程序环境`);
              this.wxFrame = frame;
              return true;
            }
          } catch (e) {
            // 跨域限制，跳过
          }
        }
      }
  
      // 检测方法3: 检查父窗口frames
      try {
        if (window.parent && window.parent.frames) {
          for (let i = 0; i < window.parent.frames.length; i++) {
            try {
              const frame = window.parent.frames[i];
              if (frame.wx && frame.__wxConfig) {
                console.log(`✅ 在父Frame ${i}中检测到小程序环境`);
                this.wxFrame = frame;
                return true;
              }
            } catch (e) {
              // 跨域限制，跳过
            }
          }
        }
      } catch (e) {
        // 无法访问父窗口
      }
  
      return false;
    }
  
    // 加载小程序配置
    loadConfiguration() {
      this.config = this.wxFrame.__wxConfig;
      this.allPages = this.config.pages || [];
      
      // 处理TabBar页面
      if (this.config.tabBar && this.config.tabBar.list) {
        this.tabBarPages = this.config.tabBar.list.map(tab => 
          tab.pagePath.replace('.html', '')
        );
      }
  
      console.log(`📊 加载完成: ${this.allPages.length}个页面, ${this.tabBarPages.length}个TabBar页面`);
    }
  
    // 通用页面分类
    categorizePages() {
      this.categorizedPages = {
        tabbar: [],
        auth: [],        // 登录/注册/权限
        home: [],        // 首页/主要功能
        list: [],        // 列表页面
        detail: [],      // 详情页面
        form: [],        // 表单/输入页面
        user: [],        // 用户相关
        order: [],       // 订单/交易
        payment: [],     // 支付相关
        setting: [],     // 设置/配置
        other: []        // 其他
      };
  
      // 分类TabBar页面
      this.tabBarPages.forEach(page => {
        this.categorizedPages.tabbar.push({
          url: page,
          name: this.generatePageName(page),
          method: 'switchTab',
          type: 'tabbar'
        });
      });
  
      // 通用关键词分类
      const categoryKeywords = {
        auth: ['login', 'register', 'auth', 'sign', 'entry', 'bridge', 'wx', '登录', '注册'],
        home: ['home', 'index', 'main', 'dashboard', 'movie', 'cinema', '首页', '主页'],
        list: ['list', 'List', 'lists', 'Lists', '列表'],
        detail: ['detail', 'Detail', 'details', 'Details', 'info', 'Info', '详情'],
        form: ['form', 'Form', 'add', 'Add', 'edit', 'Edit', 'confirm', 'Confirm', '表单', '添加', '编辑'],
        user: ['user', 'User', 'profile', 'Profile', 'person', 'Person', 'contact', 'Contact', '用户', '个人'],
        order: ['order', 'Order', 'transaction', 'record', 'history', '订单', '交易'],
        payment: ['pay', 'Pay', 'payment', 'Payment', 'recharge', 'Recharge', '支付', '充值'],
        setting: ['setting', 'Setting', 'config', 'Config', 'option', 'Option', '设置', '配置']
      };
  
      // 对非TabBar页面进行分类
      this.allPages.forEach(page => {
        if (this.tabBarPages.includes(page)) return;
  
        const pageInfo = {
          url: page,
          name: this.generatePageName(page),
          method: 'navigateTo',
          type: 'normal'
        };
  
        let categorized = false;
  
        // 根据关键词分类
        for (const [category, keywords] of Object.entries(categoryKeywords)) {
          if (keywords.some(keyword => page.toLowerCase().includes(keyword.toLowerCase()))) {
            this.categorizedPages[category].push(pageInfo);
            categorized = true;
            break;
          }
        }
  
        // 未分类的放入other
        if (!categorized) {
          this.categorizedPages.other.push(pageInfo);
        }
      });
    }
  
    // 智能生成页面名称
    generatePageName(pagePath) {
      const pathParts = pagePath.split('/');
      const fileName = pathParts[pathParts.length - 1];
      const folderName = pathParts[pathParts.length - 2];
      
      // 通用名称映射
      const nameMap = {
        // 英文
        'index': '首页', 'home': '首页', 'main': '主页',
        'login': '登录', 'register': '注册', 'auth': '认证',
        'list': '列表', 'detail': '详情', 'info': '信息',
        'form': '表单', 'add': '添加', 'edit': '编辑',
        'user': '用户', 'profile': '个人资料', 'setting': '设置',
        'order': '订单', 'pay': '支付', 'payment': '支付',
        'confirm': '确认', 'success': '成功', 'result': '结果',
        
        // 常见缩写
        'usr': '用户', 'pwd': '密码', 'cfg': '配置',
        'mgr': '管理', 'ctrl': '控制', 'nav': '导航'
      };
  
      let name = nameMap[fileName] || nameMap[folderName] || fileName;
      
      // 如果还是英文，尝试翻译
      if (!/[\u4e00-\u9fa5]/.test(name)) {
        name = this.simpleTranslate(fileName);
      }
  
      return `${name} (${folderName || 'root'})`;
    }
  
    // 简单翻译
    simpleTranslate(word) {
      const translations = {
        'cinema': '影院', 'movie': '电影', 'seat': '座位', 'ticket': '票务',
        'food': '食品', 'goods': '商品', 'shop': '商店', 'cart': '购物车',
        'coupon': '优惠券', 'card': '卡券', 'score': '积分',
        'suggestion': '建议', 'question': '问题', 'help': '帮助',
        'activity': '活动', 'promotion': '促销', 'gallery': '画廊',
        'contact': '联系人', 'phone': '电话', 'nickname': '昵称'
      };
      
      for (const [en, cn] of Object.entries(translations)) {
        if (word.toLowerCase().includes(en)) {
          return cn;
        }
      }
      
      return word;
    }
  
    // 显示主菜单
    showMenu() {
      console.clear();
      console.log('🚀 ========== 通用小程序跳转导航 ==========');
      console.log(`📱 小程序: ${this.config.appid || '未知ID'}`);
      console.log(`📊 总页面数: ${this.allPages.length}`);
      console.log('');
      
      let index = 1;
      this.menuItems = [];
  
      const categoryNames = {
        tabbar: '📱 主要页面 (TabBar)',
        auth: '🔐 登录认证',
        home: '🏠 首页功能', 
        list: '📋 列表页面',
        detail: '📄 详情页面',
        form: '📝 表单页面',
        user: '👤 用户相关',
        order: '🛒 订单交易',
        payment: '💰 支付相关',
        setting: '⚙️ 设置配置',
        other: '📦 其他页面'
      };
  
      Object.keys(this.categorizedPages).forEach(category => {
        const pages = this.categorizedPages[category];
        if (pages.length > 0) {
          console.log(`\n${categoryNames[category]} (${pages.length}个)`);
          console.log('─'.repeat(50));
          
          pages.forEach((page, i) => {
            this.menuItems.push(page);
            if (i < 6) {
              console.log(`${index.toString().padStart(2)}. ${page.name}`);
            }
            index++;
          });
          
          if (pages.length > 6) {
            console.log(`    ... 还有${pages.length - 6}个 (序号${index - pages.length + 7}-${index})，输入 nav.showAll("${category}") 查看`);
          }
        }
      });
  
      console.log('\n🎯 ========== 使用方法 ==========');
      console.log('跳转页面:   nav.go(数字)');
      console.log('搜索页面:   nav.search("关键词")'); 
      console.log('查看分类:   nav.showAll("分类名")');
      console.log('当前页面:   nav.current()');
      console.log('返回上页:   nav.back()');
      console.log('重新扫描:   nav.refresh()');
      console.log('');
      console.log('🤖 ========== 自动访问 & API抓取 ==========');
      console.log('自动全部:   nav.autoVisit()');
      console.log('自定范围:   nav.autoVisit({start:10, end:20, delay:5000})');
      console.log('按关键词:   nav.autoVisit({filter:"outPatient"})');
      console.log('停止访问:   nav.stopAutoVisit()');
      console.log('实时监听:   nav.listen(30000)        // 监听30秒');
      console.log('查看结果:   nav.getResults()');
      console.log('查看API:    nav.getAPIs()');
      console.log('导出JSON:   nav.exportAPIs()');
      console.log('\n💡 已创建全局对象 nav，开始使用吧！');
    }
  
    // 跳转到指定页面
    go(index) {
      if (!this.menuItems[index - 1]) {
        console.error(`❌ 序号无效！请输入 1-${this.menuItems.length}`);
        return;
      }
  
      const page = this.menuItems[index - 1];
      console.log(`🚀 跳转: ${page.name}`);
      console.log(`📍 路径: /${page.url}`);
  
      const options = {
        url: `/${page.url}`,
        success: () => {
          console.log(`✅ 跳转成功: ${page.name}`);
          setTimeout(() => this.current(), 500);
        },
        fail: (err) => {
          console.error('❌ 跳转失败:', err);
          this.suggestAlternative(page);
        }
      };
  
      if (page.method === 'switchTab') {
        this.wxFrame.wx.switchTab(options);
      } else {
        this.wxFrame.wx.navigateTo(options);
      }
    }
  
    // 搜索页面
    search(keyword) {
      console.log(`🔍 搜索关键词: "${keyword}"`);
      const results = [];
      
      Object.values(this.categorizedPages).flat().forEach((page, index) => {
        if (page.name.includes(keyword) || page.url.includes(keyword)) {
          results.push({ ...page, globalIndex: index + 1 });
        }
      });
  
      if (results.length === 0) {
        console.log('❌ 未找到匹配页面');
        return;
      }
  
      console.log(`\n📋 找到 ${results.length} 个相关页面:`);
      results.forEach((page, index) => {
        console.log(`${index + 1}. ${page.name} - nav.goTo("${page.url}")`);
      });
    }
  
    // 直接跳转到指定URL
    goTo(url) {
      console.log(`🎯 直接跳转: ${url}`);
      
      const isTabBar = this.tabBarPages.some(page => 
        page === url || page === url.replace('/', '') || `/${page}` === url
      );
  
      const options = {
        url: url.startsWith('/') ? url : `/${url}`,
        success: () => console.log('✅ 跳转成功'),
        fail: (err) => console.error('❌ 跳转失败:', err)
      };
  
      if (isTabBar) {
        this.wxFrame.wx.switchTab(options);
      } else {
        this.wxFrame.wx.navigateTo(options);
      }
    }
  
    // 显示所有分类页面
    showAll(category = null) {
      if (category && this.categorizedPages[category]) {
        console.log(`\n📋 ${category} 分类的所有页面:`);
        this.categorizedPages[category].forEach((page, index) => {
          console.log(`${index + 1}. ${page.name} - nav.goTo("${page.url}")`);
        });
      } else {
        console.log('\n📊 所有页面分类:');
        Object.keys(this.categorizedPages).forEach(cat => {
          console.log(`${cat}: ${this.categorizedPages[cat].length}个页面`);
        });
      }
    }
  
    // 获取当前页面信息
    current() {
      try {
        // 尝试多种方法获取当前页面
        if (this.wxFrame.getCurrentPages) {
          const pages = this.wxFrame.getCurrentPages();
          if (pages.length > 0) {
            const current = pages[pages.length - 1];
            console.log('📍 当前页面:', current.route || current.__route__ || '未知');
            return;
          }
        }
  
        if (this.wxFrame.wx && this.wxFrame.wx.getCurrentPagesPath) {
          const path = this.wxFrame.wx.getCurrentPagesPath();
          console.log('📍 当前页面:', path || '未知');
          return;
        }
  
        console.log('📍 当前页面: 无法获取');
      } catch (e) {
        console.log('📍 当前页面: 获取失败', e.message);
      }
    }
  
    // 返回上一页
    back(delta = 1) {
      this.wxFrame.wx.navigateBack({
        delta,
        success: () => console.log(`✅ 返回${delta}级页面`),
        fail: (err) => console.error('❌ 返回失败:', err)
      });
    }
  
    // 刷新配置
    refresh() {
      console.log('🔄 重新扫描小程序...');
      this.init();
    }
  
    // 建议替代方案
    suggestAlternative(page) {
      if (page.method === 'navigateTo' && this.tabBarPages.includes(page.url)) {
        console.log('💡 提示: 这可能是TabBar页面，尝试: nav.wxFrame.wx.switchTab({url:"/' + page.url + '"})');
      } else if (page.method === 'switchTab' && !this.tabBarPages.includes(page.url)) {
        console.log('💡 提示: 这可能是普通页面，尝试: nav.wxFrame.wx.navigateTo({url:"/' + page.url + '"})');
      }
    }
  
    // 导出页面列表
    export() {
      const data = {
        config: this.config,
        pages: this.allPages,
        tabBarPages: this.tabBarPages,
        categorized: this.categorizedPages
      };
      console.log('📁 页面配置数据:', data);
      return data;
    }

    // ========== 自动访问 & API 抓取 ==========

    // Hook wx.request 等网络方法，捕获所有 API 调用
    _installHook() {
      if (this._hooked) return;
      this._hooked = true;
      this._capturedAPIs = [];        // 当前页面捕获的 API
      this._allCapturedAPIs = {};     // 所有页面的 API 汇总  { pagePath: [apis] }
      this._globalAPIs = [];          // 全局去重后的 API 列表
      this._globalAPISet = new Set(); // 用 Set O(1) 去重，替代 Array.some() O(n)

      const wx = this.wxFrame.wx;
      const self = this;

      // 需要 hook 的网络方法
      const methods = ['request', 'uploadFile', 'downloadFile'];
      this._originalMethods = {};

      methods.forEach(method => {
        if (wx[method]) {
          this._originalMethods[method] = wx[method];
          wx[method] = function(options) {
            const reqMethod = (options.method || (method === 'request' ? 'GET' : method)).toUpperCase();
            const url = options.url || '';
            const apiInfo = {
              url,
              method: reqMethod,
              timestamp: new Date().toLocaleTimeString(),
              type: method
            };
            self._capturedAPIs.push(apiInfo);

            // O(1) 去重：用 "METHOD|path" 作为 key
            const dedupeKey = `${reqMethod}|${self._extractPath(url)}`;
            if (!self._globalAPISet.has(dedupeKey)) {
              self._globalAPISet.add(dedupeKey);
              self._globalAPIs.push(apiInfo);
            }

            // 调用原始方法
            return self._originalMethods[method].call(wx, options);
          };
        }
      });

      console.log('🪝 已Hook网络请求方法 (request/uploadFile/downloadFile)');
    }

    // 卸载 Hook，还原原始方法
    _uninstallHook() {
      if (!this._hooked) return;
      const wx = this.wxFrame.wx;
      Object.keys(this._originalMethods).forEach(method => {
        wx[method] = this._originalMethods[method];
      });
      this._hooked = false;
      console.log('🔓 已还原网络请求方法');
    }

    // 提取 URL 路径部分（去掉域名和参数，用于去重），带缓存
    _extractPath(url) {
      if (!this._pathCache) this._pathCache = {};
      if (this._pathCache[url]) return this._pathCache[url];
      let path;
      try {
        path = new URL(url).pathname;
      } catch {
        path = url.split('?')[0];
      }
      this._pathCache[url] = path;
      return path;
    }

    // 安全跳转：自动访问时全部用 reLaunch，确保页面栈始终只有1个页面
    _safeNavigate(pageUrl) {
      return new Promise((resolve) => {
        const url = pageUrl.startsWith('/') ? pageUrl : `/${pageUrl}`;

        // reLaunch 可以跳转到任何页面（包括 TabBar 页面），并且会销毁所有旧页面
        // 页面栈始终保持为 1，不会叠加
        this.wxFrame.wx.reLaunch({
          url,
          success: () => resolve(true),
          fail: () => {
            // reLaunch 极少失败，失败时降级 switchTab（仅 TabBar 页面需要）
            this.wxFrame.wx.switchTab({
              url,
              success: () => resolve(true),
              fail: () => {
                this.wxFrame.wx.redirectTo({
                  url,
                  success: () => resolve(true),
                  fail: () => resolve(false)
                });
              }
            });
          }
        });
      });
    }

    // 清理页面栈：reLaunch 到首页，强制 GC
    _cleanupPageStack() {
      return new Promise((resolve) => {
        const homePage = this.allPages[0] || 'pages/index/index';
        this.wxFrame.wx.reLaunch({
          url: `/${homePage}`,
          success: () => resolve(),
          fail: () => resolve()
        });
      });
    }

    // 延迟工具
    _sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 自动访问所有页面并抓取 API
     * @param {Object} opts - 配置选项
     * @param {number} opts.delay    - 每个页面等待时间(ms)，默认 3000
     * @param {number} opts.start    - 起始页面序号(1-based)，默认 1
     * @param {number} opts.end      - 结束页面序号(1-based)，默认全部
     * @param {string} opts.filter   - 只访问 URL 包含该关键词的页面
     * @param {boolean} opts.silent  - 静默模式，减少日志，默认 false
     * 
     * 用法：
     *   nav.autoVisit()                          // 访问所有页面，每页等3秒
     *   nav.autoVisit({delay: 5000})             // 每页等5秒
     *   nav.autoVisit({start: 10, end: 20})      // 只访问第10-20个页面
     *   nav.autoVisit({filter: "outPatient"})    // 只访问包含 outPatient 的页面
     */
    async autoVisit(opts = {}) {
      const delay = opts.delay || 3000;
      const filter = opts.filter || '';
      const clearInterval = opts.clearEvery || 50;   // 每50个页面清一次控制台
      const gcInterval = opts.gcEvery || 20;          // 每20个页面做一次页面栈清理

      // 构建要访问的页面列表
      let pages = Object.values(this.categorizedPages).flat();
      if (filter) {
        pages = pages.filter(p => p.url.includes(filter) || p.name.includes(filter));
      }
      const startIdx = Math.max(0, (opts.start || 1) - 1);
      const endIdx = Math.min(pages.length, opts.end || pages.length);
      pages = pages.slice(startIdx, endIdx);

      if (pages.length === 0) {
        console.error('❌ 没有符合条件的页面');
        return;
      }

      console.clear();
      console.log('🤖 ═══ 自动访问模式 ═══');
      console.log(`📊 ${pages.length} 个页面 | ⏱️ 每页 ${delay}ms | ⏳ ~${Math.ceil(pages.length * delay / 1000 / 60)}分钟`);
      console.log(`💡 停止: nav.stopAutoVisit()`);

      // 安装 Hook
      this._installHook();
      this._isAutoVisiting = true;
      this._autoVisitResults = {};

      const startTime = Date.now();
      let successCount = 0;
      let failCount = 0;
      let totalAPIs = 0;

      for (let i = 0; i < pages.length; i++) {
        if (!this._isAutoVisiting) {
          console.log('⏹️ 已停止');
          break;
        }

        const page = pages[i];
        this._capturedAPIs = [];

        // 每 N 个页面清一次控制台，防止日志堆积卡顿
        if (i > 0 && i % clearInterval === 0) {
          console.clear();
          console.log(`🤖 自动访问中... 已完成 ${i}/${pages.length} | ✅${successCount} ❌${failCount} | API: ${totalAPIs} (去重${this._globalAPIs.length})`);
        }

        // 每 N 个页面做一次页面栈清理：先跳回首页销毁所有页面，释放内存
        if (i > 0 && i % gcInterval === 0) {
          await this._cleanupPageStack();
          await this._sleep(500);  // 等待清理完成
        }

        // 跳转 — 只打一行进度
        const ok = await this._safeNavigate(page.url);

        if (!ok) {
          failCount++;
          this._autoVisitResults[page.url] = { name: page.name, status: 'fail', apis: [] };
          console.log(`[${i+1}/${pages.length}] ❌ ${page.url}`);
          continue;
        }

        successCount++;
        await this._sleep(delay);

        // 收集 API — 只存不打印，最后统一输出
        const apis = this._capturedAPIs.map(a => ({ url: a.url, method: a.method }));
        totalAPIs += apis.length;
        this._allCapturedAPIs[page.url] = apis;
        this._autoVisitResults[page.url] = { name: page.name, status: 'ok', apis };

        // 精简输出：一行搞定
        const apiCount = apis.length > 0 ? `🌐${apis.length}个API` : '📭无API';
        console.log(`[${i+1}/${pages.length}] ✅ ${page.url}  ${apiCount}`);
      }

      this._isAutoVisiting = false;
      const elapsed = Math.ceil((Date.now() - startTime) / 1000);

      // ========== 清屏后输出干净的汇总报告 ==========
      console.clear();
      console.log('🏁 ══════════ 自动访问完成 ══════════');
      console.log(`⏱️ ${elapsed}秒 | ✅${successCount} ❌${failCount} / ${pages.length}页`);
      console.log(`🌐 API总数: ${totalAPIs}  去重后: ${this._globalAPIs.length}`);

      // 只输出有API的页面，精简格式
      console.log('\n📋 各页面API:');
      let pageIdx = 0;
      Object.keys(this._allCapturedAPIs).forEach(pageUrl => {
        const apis = this._allCapturedAPIs[pageUrl];
        if (apis.length > 0) {
          pageIdx++;
          const apiStrs = apis.map(a => `[${a.method}]${this._extractPath(a.url)}`).join(' | ');
          console.log(`${pageIdx}. ${pageUrl}  →  ${apiStrs}`);
        }
      });

      // 去重 API 列表
      console.log(`\n🌐 去重API列表 (${this._globalAPIs.length}个):`);
      this._globalAPIs.forEach((api, idx) => {
        console.log(`${(idx+1).toString().padStart(3)}. [${api.method}] ${api.url}`);
      });

      console.log('\n💡 nav.getAPIs() / nav.exportAPIs() / nav.getResults()');

      // 清理
      this._pathCache = {};
      this._uninstallHook();
    }

    // 停止自动访问
    stopAutoVisit() {
      this._isAutoVisiting = false;
      console.log('⏹️  正在停止自动访问...(将在当前页面完成后停止)');
    }

    // 获取自动访问结果
    getResults() {
      if (!this._autoVisitResults || Object.keys(this._autoVisitResults).length === 0) {
        console.log('❌ 暂无结果，请先运行 nav.autoVisit()');
        return null;
      }
      console.log('📊 自动访问结果:', this._autoVisitResults);
      return this._autoVisitResults;
    }

    // 获取去重后的 API 列表
    getAPIs() {
      if (!this._globalAPIs || this._globalAPIs.length === 0) {
        console.log('❌ 暂无API数据，请先运行 nav.autoVisit()');
        return [];
      }
      console.log(`🌐 共 ${this._globalAPIs.length} 个去重API:`);
      this._globalAPIs.forEach((api, idx) => {
        console.log(`${(idx + 1).toString().padStart(3)}. [${api.method.padEnd(6)}] ${api.url}`);
      });
      return this._globalAPIs;
    }

    // 导出为 JSON（方便复制保存）
    exportAPIs() {
      if (!this._globalAPIs || this._globalAPIs.length === 0) {
        console.log('❌ 暂无API数据，请先运行 nav.autoVisit()');
        return '';
      }

      const exportData = {
        timestamp: new Date().toISOString(),
        appid: this.config.appid || '未知',
        totalPages: Object.keys(this._allCapturedAPIs).length,
        totalAPIs: this._globalAPIs.length,
        apiList: this._globalAPIs.map(a => ({
          method: a.method,
          url: a.url,
          path: this._extractPath(a.url)
        })),
        pageDetails: {}
      };

      Object.keys(this._allCapturedAPIs).forEach(pageUrl => {
        exportData.pageDetails[pageUrl] = this._allCapturedAPIs[pageUrl].map(a => ({
          method: a.method,
          url: a.url,
          path: this._extractPath(a.url)
        }));
      });

      const json = JSON.stringify(exportData, null, 2);
      console.log('📦 JSON数据已生成（已复制到剪贴板）:');
      console.log(json);

      // 尝试复制到剪贴板
      try {
        if (navigator && navigator.clipboard) {
          navigator.clipboard.writeText(json);
        } else if (typeof copy === 'function') {
          copy(json);
        }
      } catch(e) {}

      return json;
    }

    /**
     * 只抓取API不跳转 - 停留在当前页面持续监听
     * @param {number} duration - 监听时长(ms)，默认 30000 (30秒)
     * 用法：nav.listen(60000)  // 监听60秒
     */
    async listen(duration = 30000) {
      console.log(`👂 开始监听API请求，持续 ${duration / 1000} 秒...`);
      console.log('💡 提示: 在此期间请手动操作小程序，所有请求都会被记录');

      this._installHook();
      this._capturedAPIs = [];

      const startLen = this._globalAPIs ? this._globalAPIs.length : 0;
      let lastCount = 0;

      // 定时输出实时状态
      const timer = setInterval(() => {
        if (this._capturedAPIs.length > lastCount) {
          const newAPIs = this._capturedAPIs.slice(lastCount);
          newAPIs.forEach(api => {
            console.log(`  🆕 [${api.method}] ${api.url}`);
          });
          lastCount = this._capturedAPIs.length;
        }
      }, 500);

      await this._sleep(duration);
      clearInterval(timer);

      const captured = [...this._capturedAPIs];
      console.log(`\n👂 监听结束，共捕获 ${captured.length} 个请求:`);
      captured.forEach((api, idx) => {
        console.log(`  ${idx + 1}. [${api.method}] ${api.url}`);
      });

      const newGlobal = (this._globalAPIs ? this._globalAPIs.length : 0) - startLen;
      console.log(`🆕 新发现 ${newGlobal} 个不重复API`);

      this._uninstallHook();
      return captured;
    }
  }
  
  // 创建全局导航器实例
  console.log('🚀 正在初始化通用小程序导航器...');
  try {
    window.nav = new UniversalMiniProgramNavigator();
  } catch (e) {
    console.error('❌ 初始化失败:', e.message);
    console.log('💡 请确保在小程序的CDP调试环境中运行此脚本');
  }