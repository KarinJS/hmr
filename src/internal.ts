/**
 * 内部工具函数
 * 用于获取ESM缓存
 */

/**
 * ESM模块加载缓存
 * 支持Node.js 18+
 */
export const loadCache = await (async () => {
  try {
    // 尝试获取较新版本Node.js的ESM缓存(Node.js v20.6+)
    // @ts-ignore - 访问内部API
    const module = await import('node:internal/modules/esm/loader')
    return module.default.getOrInitializeCascadedLoader().loadCache
  } catch (error) {
    // 尝试获取较旧版本Node.js的ESM缓存(Node.js v18+)
    // @ts-ignore - 访问内部API
    const module = await import('node:internal/process/esm_loader')
    return module.default.esmLoader
  }
})()

/**
 * 传入一个模块URL，返回所有依赖该模块的模块URL数组，如果依赖该模块的模块还依赖了其他模块，则也会包含这些模块的URL。
 * @param moduleUrl 模块的URL
 * @param exclude 排除的模块URL数组
 * @returns 依赖该模块的模块URL数组
 */
export const findDependentModules = async (moduleUrl: string, exclude: string[] = []): Promise<string[]> => {
  const result: string[] = []
  const visited = new Set<string>(exclude)

  const collectDependents = async (url: string) => {
    if (visited.has(url)) {
      return
    }

    visited.add(url)
    result.push(url)

    // 遍历整个缓存，查找依赖当前模块的其他模块
    for (const [cacheUrl, moduleData] of loadCache) {
      if (cacheUrl.includes('node_modules') || cacheUrl.includes('node:')) {
        continue // 跳过 node_modules 中的模块
      }
      if (visited.has(cacheUrl)) {
        continue
      }

      // 检查这个模块是否依赖当前模块
      if (moduleData?.javascript?.linked || moduleData?.linked) {
        try {
          const linkedModules = await moduleData.javascript?.linked || moduleData.linked
          const modules = Array.from(linkedModules)

          for (const linkedModule of modules) {
            // @ts-ignore
            if (linkedModule.url === url) {
              // 找到依赖当前模块的模块，递归收集它的依赖者
              await collectDependents(cacheUrl)
              break
            }
          }
        } catch (error) {
          // 忽略链接错误，继续处理其他模块
          console.error(`Error processing linked modules for ${cacheUrl}:`, error)
          continue
        }
      }
    }
  }

  await collectDependents(moduleUrl)
  return result.slice(1) // 移除第一个元素（目标模块本身）
}
