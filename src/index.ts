/**
 * 必须使用 node --expose-internals ./src/index.js 运行
 * tsx: node --expose-internals --import tsx ./src/test/demo.ts
 */

import path from 'node:path'
import chokidar from 'chokidar'
import { EventEmitter } from 'node:events'
import { findDependentModules, loadCache } from './internal'
import type { FSWatcher, ChokidarOptions } from 'chokidar'

/**
 * fileUrl 前缀
 * - windows: `file:///`
 * - macOS/Linux: `file://`
 */
const fileUrlPrefix = process.platform === 'win32' ? 'file:///' : 'file://'

/**
 * @class HMRModule
 * @extends EventEmitter
 * HMR 模块
 */
export class HMRModule extends EventEmitter {
  #exclude: string[]
  #watcher: FSWatcher

  /**
   * 构造函数
   * @param files 模块文件路径
   * @param options 选项
   */
  constructor (files: string | string[], options: ChokidarOptions & { exclude?: string[] } = {
    ignoreInitial: true,
    ignored: /(^|[/\\])\../,
  }) {
    super()
    this.#exclude = options.exclude || []
    this.#watcher = chokidar.watch(files, options)
    this.#init()
  }

  #init () {
    this.#watcher.on('all', async (event, file) => {
      const fileUrl = this._formatFileUrl(file)

      if (event === 'change' || event === 'unlink') {
        if (loadCache.has(fileUrl)) {
          const result = await this.#clearCache(fileUrl)
          this.emit('change', fileUrl, result)
          return
        }
      }

      this.emit(event, fileUrl, false)
    })
  }

  get closed (): boolean {
    return this.#watcher.closed
  }

  /**
   * 格式化文件路径为 file URL
   * - Windows: `file:///D:/path/to/file.js`
   * - macOS/Linux: `file:///D:/path/to/file.js`
   * @param filePath 模块文件路径
   */
  _formatFileUrl (filePath: string): string {
    /** 规范化路径 */
    const normalizedPath = this._normalize(filePath)
    /** 添加 file URL 前缀 */
    return `${fileUrlPrefix}${normalizedPath}`
  }

  /**
   * 规范化路径
   * @param filePath
   */
  _normalize (filePath: string): string {
    /** 转换为绝对路径 */
    const absolutePath = path.resolve(filePath)
    /** 替换反斜杠为正斜杠 */
    return absolutePath.replace(/\\/g, '/')
  }

  /**
   * 监听模块文件变化
   * @param filePath 模块文件路径
   */
  add (filePath: string | string[]): this {
    const paths = Array.isArray(filePath) ? filePath : [filePath]
    const formattedPaths = paths.map(p => this._normalize(p))
    this.#watcher.add(formattedPaths)
    return this
  }

  /**
   * 关闭指定路径的监听事件
   * @param filePath 模块文件路径
   */
  unwatch (filePath: string | string[]): this {
    const paths = Array.isArray(filePath) ? filePath : [filePath]
    const formattedPaths = paths.map(p => this._normalize(p))
    this.#watcher.unwatch(formattedPaths)
    return this
  }

  close (): Promise<void> {
    return this.#watcher.close()
  }

  getWatched (): Record<string, string[]> {
    return this.#watcher.getWatched()
  }

  /**
   * 清理缓存
   * @param fileUrl 模块文件路径
   */
  async #clearCache (fileUrl: string) {
    const isHas = loadCache.has(fileUrl)
    if (!isHas) return []

    const result = await findDependentModules(fileUrl, this.#exclude)
    /** 加上当前文件本身 */
    result.unshift(fileUrl)
    result.forEach(key => loadCache.delete(key))
    return result
  }
}
