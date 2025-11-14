# Simple Live Web - 网页版直播聚合

基于 [dart_simple_live](https://github.com/xiaoyaocz/dart_simple_live) 项目的网页版实现。

## ✨ 特性

- 🎥 支持多平台直播（目前支持哔哩哔哩）
- 💬 实时弹幕显示，支持弹幕设置
-  响应式设计，完美适配移动端
- 🚀 零依赖部署，使用 Cloudflare Pages + Workers
- ⚡ 快速加载，全球 CDN 加速
- 💰 完全免费，无需服务器

## 🎯 功能

- [x] B站直播观看
- [x] 实时弹幕显示
- [x] 弹幕设置（透明度、字体大小、速度、显示区域）
- [x] 弹幕开关控制
- [x] 礼物和欢迎消息
- [x] 实时人气值显示
- [x] 直播间信息展示
- [x] FLV 视频播放
- [x] 移动端适配
- [x] 全屏播放
- [ ] 发送弹幕（计划中）
- [ ] 斗鱼直播（计划中）
- [ ] 虎牙直播（计划中）

## 📦 项目结构

```
simple-live-web/
├── public/                    # 前端静态文件
│   ├── index.html            # 首页
│   ├── player.html           # 播放器
│   ├── css/
│   │   ├── style.css         # 主样式文件（含移动端适配）
│   │   └── danmaku.css       # 弹幕样式文件
│   ├── js/
│   │   ├── main.js           # 首页逻辑
│   │   ├── player.js         # 播放器逻辑
│   │   ├── danmaku.js        # 弹幕管理器
│   │   └── sites/
│   │       └── bilibili.js   # B站API封装
│   └── libs/                 # 第三方库
│
└── functions/                 # Cloudflare Workers
    └── api/
        └── bilibili/
            ├── room.js       # 获取房间信息
            └── play.js       # 获取播放地址
```

## 🚀 快速开始

### 方式一：Cloudflare Pages 部署（推荐）

1. Fork 本项目到你的 GitHub
2. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
3. 进入 **Workers & Pages** → **Create application** → **Pages**
4. 连接 GitHub 仓库
5. 配置构建设置：
   - 构建命令：（留空）
   - 构建输出目录：`public`
6. 点击 **Save and Deploy**
7. 等待部署完成，访问生成的 URL

### 方式二：本地开发

1. 安装 Wrangler CLI：
```bash
npm install -g wrangler
```

2. 克隆项目：
```bash
git clone <your-repo-url>
cd simple-live-web
```

3. 启动本地开发服务器：
```bash
wrangler pages dev public
```

4. 访问 http://localhost:8788

### 方式三：直接打开（仅前端预览）

由于跨域限制，直接打开 HTML 文件无法调用 API，但可以查看页面布局。

## 📱 移动端使用

项目完全支持移动端：

- ✅ 响应式布局
- ✅ 触摸优化
- ✅ 横屏播放支持
- ✅ 全屏播放
- ✅ 移动端视频播放优化

## 🎮 使用方法

### 观看直播

1. 在首页输入房间号（如：`545068`）
2. 点击"观看直播"按钮
3. 等待加载播放

### 弹幕功能

#### 控制弹幕
- 点击右上角 **💬 弹幕** 按钮可以开关弹幕显示
- 点击 **⚙️ 设置** 按钮打开弹幕设置面板

#### 弹幕设置
- **显示弹幕**: 开关弹幕显示
- **不透明度**: 调整弹幕透明度（0-100%）
- **字体大小**: 调整弹幕字号（16-36px）
- **弹幕速度**: 调整弹幕移动速度（4-12秒）
- **显示区域**: 调整弹幕显示区域（25-100%）

#### 弹幕类型
- **普通弹幕**: 白色文字
- **VIP弹幕**: 金色文字
- **管理员弹幕**: 红色文字
- **礼物消息**: 底部紫色气泡
- **欢迎消息**: 底部蓝色气泡

### 快捷房间号

以下是一些可以测试的 B站直播间号：

- `545068` - 高人气直播间
- `21852` - 游戏直播
- `76` - VTuber直播
- `6` - 热门主播

## 🔧 技术栈

- **前端**: HTML5 + CSS3 + 原生 JavaScript
- **视频播放**: flv.js (来自 bilibili)
- **弹幕通信**: WebSocket (直连直播平台)
- **API代理**: Cloudflare Workers (Serverless)
- **部署**: Cloudflare Pages
- **CDN**: Cloudflare 全球网络（中国有50+节点）

## 🌍 性能

- **API 延迟**: 10-60ms（自动路由到最近节点）
- **视频加载**: 用户直连直播平台 CDN
- **弹幕延迟**: < 200ms（WebSocket 直连）
- **弹幕性能**: 优化的动画渲染，支持高密度弹幕
- **全球访问**: Cloudflare 全球 CDN 加速
- **中国优化**: Cloudflare 在中国有 50+ 个数据中心

## 📝 开发说明

### 添加新平台

1. 在 `functions/api/` 下创建平台目录
2. 实现 `room.js` 和 `play.js` API
3. 在 `public/js/sites/` 创建平台封装类
4. 在首页添加平台按钮

### API 说明

#### 获取房间信息
```
GET /api/bilibili/room?id={roomId}
```

#### 获取播放地址
```
GET /api/bilibili/play?id={roomId}&quality={quality}
```

### 弹幕架构

弹幕使用 WebSocket 直连直播平台服务器：

```
用户浏览器 ──WebSocket──> 直播平台弹幕服务器
     │
     └──> DanmakuManager 管理类
          ├── 接收弹幕消息
          ├── 解析二进制数据包
          ├── 创建弹幕DOM元素
          └── 执行CSS动画
```

**优势**:
- 实时性好（< 200ms延迟）
- 无需服务器转发（节省成本）
- 支持自动重连
- 支持心跳保活

## ⚠️ 注意事项

1. 本项目仅供学习交流使用
2. 请遵守各直播平台的服务条款
3. 不要用于商业用途
4. 视频内容版权归原作者所有

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可

本项目基于原项目协议，仅供学习使用。

## 🙏 致谢

- [dart_simple_live](https://github.com/xiaoyaocz/dart_simple_live) - 原项目
- [flv.js](https://github.com/bilibili/flv.js) - B站开源的 FLV 播放器
- [Cloudflare Pages](https://pages.cloudflare.com/) - 免费托管平台
- B站开放平台 - 提供直播 API

## 📞 联系

如有问题，请提交 Issue 或 PR。

---

**Star ⭐ 本项目，持续更新中！**