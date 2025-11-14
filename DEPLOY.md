# 部署指南 - Simple Live Web

## 🚀 一键部署到 Cloudflare Pages

### 前提条件

- GitHub 账号
- Cloudflare 账号（免费）

### 步骤

#### 1. 准备代码

```bash
# 如果还没有推送到 GitHub
cd simple-live-web
git init
git add .
git commit -m "Initial commit: Simple Live Web"

# 在 GitHub 创建仓库后
git remote add origin https://github.com/你的用户名/simple-live-web.git
git branch -M main
git push -u origin main
```

#### 2. 部署到 Cloudflare Pages

1. 访问 https://dash.cloudflare.com/
2. 登录你的账号
3. 点击左侧 **Workers & Pages**
4. 点击 **Create application**
5. 选择 **Pages** 标签
6. 点击 **Connect to Git**
7. 授权 Cloudflare 访问你的 GitHub
8. 选择 `simple-live-web` 仓库
9. 配置构建设置：
   ```
   项目名称: simple-live-web（或自定义）
   生产分支: main
   构建命令: （留空）
   构建输出目录: public
   根目录: /
   ```
10. 点击 **Save and Deploy**
11. 等待 1-2 分钟部署完成
12. 获得你的网站地址：`https://simple-live-web.pages.dev`

#### 3. 测试

访问你的网站：
- 首页：`https://你的项目.pages.dev/`
- 直接观看：`https://你的项目.pages.dev/player.html?platform=bilibili&room=545068`

---

## 🔧 本地开发

### 方法一：使用 Wrangler（推荐）

```bash
# 1. 安装 Wrangler CLI
npm install -g wrangler

# 2. 登录 Cloudflare
wrangler login

# 3. 启动本地开发服务器
cd simple-live-web
wrangler pages dev public

# 4. 访问 http://localhost:8788
```

### 方法二：使用任何静态服务器

```bash
# 使用 Python
cd simple-live-web/public
python -m http.server 8080

# 或使用 Node.js
npx http-server public -p 8080

# 访问 http://localhost:8080
```

**注意**: 不使用 Wrangler 时，API 功能将不可用（因为没有 Workers 函数）。

---

## 📝 自定义域名

### 在 Cloudflare Pages 添加自定义域名

1. 进入你的项目页面
2. 点击 **Custom domains**
3. 点击 **Set up a custom domain**
4. 输入你的域名（如 `live.yourdomain.com`）
5. Cloudflare 会自动配置 DNS
6. 等待 SSL 证书颁发（几分钟）
7. 完成！访问你的自定义域名

---

## 🔄 更新部署

### 自动部署

每次推送代码到 GitHub 的 `main` 分支，Cloudflare 会自动重新部署。

```bash
# 修改代码后
git add .
git commit -m "更新说明"
git push

# Cloudflare 会自动部署新版本
```

### 手动部署

```bash
# 使用 Wrangler CLI
wrangler pages publish public
```

---

## 🐛 故障排查

### 问题 1：页面显示 404

**原因**: 构建输出目录配置错误

**解决**:
1. 确保构建输出目录设置为 `public`
2. 检查文件结构是否正确

### 问题 2：API 调用失败

**原因**: Workers 函数未正确部署

**解决**:
1. 确保 `functions/` 目录在项目根目录
2. 检查 API 文件是否使用 `export async function onRequest`
3. 查看 Cloudflare Dashboard 的部署日志

### 问题 3：视频无法播放

**可能原因**:
- 房间号错误
- 主播未开播
- 浏览器不支持 FLV

**解决**:
1. 确认房间号正确
2. 在 B站 检查主播是否在直播
3. 使用现代浏览器（Chrome、Edge、Firefox）
4. 检查浏览器控制台错误信息

### 问题 4：CORS 错误

**原因**: API 响应缺少 CORS 头

**解决**:
检查 `functions/api/` 下的文件是否包含：
```javascript
headers: {
  'Access-Control-Allow-Origin': '*',
  // ...
}
```

---

## 📊 性能优化

### 1. 启用缓存

Cloudflare 会自动缓存静态资源（HTML、CSS、JS）。

### 2. 压缩资源

Cloudflare 自动压缩文本资源（Gzip/Brotli）。

### 3. 图片优化

使用 Cloudflare 的图片优化功能：
1. 进入项目设置
2. 开启 **Image Optimization**

---

## 🔐 安全设置

### 1. 环境变量

如果需要存储敏感信息（如API密钥）：

1. 进入项目 **Settings**
2. **Environment variables**
3. 添加变量
4. 在 Workers 中使用：
```javascript
export async function onRequest(context) {
  const { env } = context;
  const apiKey = env.API_KEY;
  // ...
}
```

### 2. 访问控制

在 Cloudflare Dashboard 配置：
- IP 白名单/黑名单
- 地理限制
- Rate Limiting

---

## 📈 监控

### 查看访问统计

1. 进入项目页面
2. 查看 **Analytics** 标签
3. 可以看到：
   - 访问量
   - 带宽使用
   - 请求次数
   - 错误率

### 查看实时日志

1. 进入项目页面
2. 点击 **Functions**
3. 查看 **Logs** 实时输出

---

## 💰 费用说明

### Cloudflare Pages 免费版

- ✅ 无限带宽
- ✅ 无限请求
- ✅ 自动 HTTPS
- ✅ 全球 CDN
- ✅ 自动部署

### Cloudflare Workers 免费版

- ✅ 每天 100,000 次请求
- ✅ 足够个人使用

**对于个人项目，完全免费！**

---

## 🎉 部署完成

访问你的网站：`https://你的项目.pages.dev`

享受你的直播聚合网站吧！🎊