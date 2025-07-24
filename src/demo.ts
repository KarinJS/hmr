/**
 * HMR模块使用示例
 */

import { HMRModule } from './index.js'

/**
 * 创建HMR实例
 */
const hmr = new HMRModule('./src/**/*.{js,ts}')

/**
 * 监听文件变更事件
 */
hmr.on('change', async (fileUrl: string, isCached: boolean) => {
  console.log(`文件变更: ${fileUrl}`)
  if (isCached) {
    console.log('模块已从缓存中删除，可以重新导入')

    try {
      // 这里可以重新导入模块
      const module = await import(fileUrl)
      console.log('重新导入成功:', Object.keys(module))
    } catch (error) {
      console.error('重新导入失败:', error)
    }
  }
})

/**
 * 监听添加事件
 */
hmr.on('add', (fileUrl: string) => {
  console.log(`文件添加: ${fileUrl}`)
})

/**
 * 监听删除事件
 */
hmr.on('unlink', (fileUrl: string) => {
  console.log(`文件删除: ${fileUrl}`)
})

console.log('HMR已启动, 监控的文件:', hmr.getWatched())
console.log('修改src目录下的文件以查看热重载效果')

// 保持进程运行
process.stdin.resume()
console.log('按Ctrl+C退出')
