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
