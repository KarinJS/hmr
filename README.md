# Node.js 纯 ESM 热模块替换 (HMR)

一个轻量级的 **纯 ESM** Node.js 热模块替换(HMR)工具，可以在不重启应用的情况下重新加载修改的 ES 模块。

[English](./README.en.md) | 中文

## 特点

- **纯 ESM 实现** - 专为 ES 模块设计
- 自动注入 `--expose-internals` 参数，无需手动添加
- 支持 TypeScript 和 JavaScript 文件
- 简单易用的 API
- 提供命令行工具

## 安装

```bash
# 使用 pnpm
pnpm add @karinjs/node-hmr

# 使用 npm
npm install @karinjs/node-hmr

# 使用 yarn
yarn add @karinjs/node-hmr
```

## 命令行使用

安装后，你可以使用 `hmr` 命令来运行你的应用，它会自动注入所需的 `--expose-internals` 参数：

```bash
# 运行 JavaScript 文件
hmr ./src/app.js

# 使用 tsx 运行 TypeScript 文件
hmr ./src/app.ts --tsx

# 传递其他参数
hmr ./src/server.js --port 3000
```

## 手动使用

如果你不想使用命令行工具，可以直接使用 Node.js 运行：

```bash
# 对于 JavaScript 文件
node --expose-internals ./your-file.js

# 对于 TypeScript 文件
node --expose-internals --import tsx ./your-file.ts
```

## API 使用

你也可以在代码中直接使用 HMR API：

```typescript
import { HMRModule } from '@karinjs/node-hmr';

// 创建 HMR 实例，监听文件变化
const hmr = new HMRModule('./src/**/*.{js,ts}');

// 监听文件变更事件
hmr.on('change', async (fileUrl, isCached) => {
  console.log(`文件变更: ${fileUrl}`);
  if (isCached) {
    console.log('模块已从缓存中删除，可以重新导入');
    
    try {
      // 重新导入模块
      const module = await import(fileUrl);
      console.log('重新导入成功:', Object.keys(module));
    } catch (error) {
      console.error('重新导入失败:', error);
    }
  }
});

// 监听其他事件
hmr.on('add', (fileUrl) => {
  console.log(`文件添加: ${fileUrl}`);
});

hmr.on('unlink', (fileUrl) => {
  console.log(`文件删除: ${fileUrl}`);
});

// 获取所有被监控的文件
console.log(hmr.getWatched());
```

> **注意**：API 方式使用时，仍然需要使用 `--expose-internals` 参数启动 Node.js。推荐使用命令行方式运行，它会自动处理这个问题。

## API 参考

### HMRModule

`HMRModule` 类继承自 `EventEmitter`，提供以下方法和属性：

#### 构造函数

```typescript
constructor(files: string | string[], options?: ChokidarOptions)
```

- `files`: 要监控的文件路径，支持 glob 模式
- `options`: chokidar 监听选项，默认值为 `{ ignoreInitial: true, ignored: /(^|[/\\])\./ }`

#### 方法

- `add(filePath: string | string[]): this` - 添加监控文件
- `unwatch(filePath: string | string[]): this` - 取消监控文件
- `close(): Promise<void>` - 关闭监控
- `getWatched(): Record<string, string[]>` - 获取所有被监控的文件

#### 属性

- `closed: boolean` - 监控是否已关闭

#### 事件

- `'change'` - 文件内容变更时触发，参数：`(fileUrl: string, isCached: boolean)`
- `'add'` - 添加新文件时触发，参数：`(fileUrl: string, isCached: boolean)`
- `'unlink'` - 删除文件时触发，参数：`(fileUrl: string, isCached: boolean)`
- 其他 chokidar 事件

## 实现原理

本工具专为 **ES 模块 (ESM)** 设计，通过 `--expose-internals` 标志访问 Node.js 的内部 ESM 模块缓存。当文件变更时，它会从缓存中清除相应的模块，允许重新导入更新后的代码。

工作流程如下：

1. 工具使用 chokidar 库监控文件变化
2. 当文件变更时，它将文件路径转换为文件 URL 格式（ESM 使用的格式）
3. 检查模块是否存在于 ESM 模块缓存中
4. 如果找到，则从缓存中删除模块
5. 应用程序可以重新导入模块以获取更新后的代码

### 仅支持 ESM

本工具专为 ES 模块设计，不适用于 CommonJS 模块。你的项目应该在 package.json 中使用 `"type": "module"` 或使用 `.mjs` 文件扩展名。

## 致谢

实现思路来自于 Sylphy (QQ: 1393***348)，感谢其提供的宝贵思路和技术支持。

## 警告

⚠️ **本工具使用 Node.js 内部 API，请勿在生产环境使用！**

⚠️ **内部 API 可能随 Node.js 版本变化而变化，可能导致兼容性问题！**

## 要求

- Node.js 18+
- ES 模块（不兼容 CommonJS）

## 许可

MIT
