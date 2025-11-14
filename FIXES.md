# 直播视频加载修复说明

## 修复内容

### 1. 统一 API 返回格式

所有平台的 API 现在返回统一格式：

**成功响应：**
```json
{
  "code": 0,
  "data": {
    "title": "直播标题",
    "userName": "主播名称",
    "userAvatar": "头像URL",
    "online": 123456,
    "introduction": "简介",
    "status": true,
    "platform": "平台标识"
  }
}
```

**播放地址响应：**
```json
{
  "code": 0,
  "urls": ["流地址1", "流地址2"],
  "type": "flv|hls"
}
```

**错误响应：**
```json
{
  "code": -1,
  "error": "错误信息"
}
```

### 2. B站 API 修复

- **问题**: B站 API 有风控机制，返回 -352 错误码
- **解决方案**: 
  - 使用移动端 API 端点绕过风控
  - `room`: `https://api.live.bilibili.com/room/v1/Room/get_info`
  - 添加用户信息 API 调用获取主播信息
  - 根据实际 URL 自动判断流类型（HLS/FLV）

### 3. 前端数据解析统一

所有平台的前端 sites 文件现在：
- 统一检查 `code` 字段
- 使用 `data.data` 获取房间信息
- 简化错误处理逻辑

## 已测试平台

### ✅ 哔哩哔哩 (Bilibili)
- **状态**: 正常工作
- **流类型**: HLS (m3u8)
- **测试房间**: 545068, 21852, 76, 6

### ⚠️ 斗鱼 (Douyu)
- **状态**: API 已实现，需要真实房间号测试
- **流类型**: HLS
- **注意**: 需要测试移动端 API 是否稳定

### ⚠️ 虎牙 (Huya)
- **状态**: API 已实现，需要真实房间号测试
- **流类型**: FLV
- **注意**: 需要解析移动端页面 HTML

### ⚠️ 抖音 (Douyin)
- **状态**: API 已实现，需要真实房间号测试
- **流类型**: FLV/HLS
- **注意**: 需要解析页面 JSON 数据

## 部署说明

### 本地开发
```bash
npm install -g wrangler
wrangler pages dev public --port 8788
```

### Cloudflare Pages 部署
1. 推送代码到 GitHub
2. 在 Cloudflare Pages 连接仓库
3. 构建设置：
   - 构建命令：（留空）
   - 构建输出目录：`public`
4. 部署完成后即可使用

## 技术架构

```
用户浏览器
    ↓
Cloudflare Pages (静态文件)
    ↓
Cloudflare Workers (API 代理)
    ↓
直播平台 API
    ↓
直播平台 CDN (视频流直连)
```

## 注意事项

1. **跨域问题**: Workers 函数处理 CORS，确保所有响应都包含 `Access-Control-Allow-Origin: *`
2. **风控机制**: 各平台可能有反爬虫机制，需要适当的 User-Agent 和 Referer
3. **流地址时效**: 直播流地址通常有时效性，需要定期刷新
4. **移动端优化**: 项目已完全支持移动端访问

## 后续优化建议

1. 添加流地址缓存机制
2. 实现多清晰度切换
3. 添加更多平台支持
4. 优化错误提示和重试机制
5. 添加播放统计和监控