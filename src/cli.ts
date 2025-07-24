#!/usr/bin/env node

/**
 * HMR CLI入口
 * 自动为Node.js进程注入--expose-internals参数
 */

import { spawn } from 'node:child_process'
import { Command } from 'commander'
import { readFileSync } from 'node:fs'

/**
 * 获取包信息
 */
const packageJson = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8')
)

/**
 * 创建命令行程序
 */
const program = new Command()

program
  .name('hmr')
  .description('Node.js热模块替换(HMR)工具，自动注入--expose-internals参数')
  .version(packageJson.version)
  .option('--tsx', '使用tsx运行TypeScript文件')
  .option('--ts-node', '使用ts-node运行TypeScript文件')
  .argument('<file>', '要运行的文件路径')
  .allowUnknownOption()
  .usage('[选项] <文件路径>')
  .addHelpText('after', `
示例:
  hmr ./src/app.ts                # 直接运行TS文件
  hmr ./src/app.ts --tsx          # 使用tsx运行TS文件
  hmr ./src/app.ts --ts-node      # 使用ts-node运行TS文件
  hmr ./src/server.js --port 3000 # 运行JS文件并传递额外参数

实现原理:
  本工具通过访问Node.js内部API (--expose-internals) 获取ESM模块缓存，
  当文件变更时清除对应模块的缓存，实现热重载。

手动使用方式:
  如不想使用CLI，可以直接使用以下命令启动:
  - JS文件:  node --expose-internals ./your-file.js
  - TS文件:  node --expose-internals --import tsx ./your-file.ts

警告:
  ⚠️ 本工具使用Node.js内部API，不建议在生产环境使用!
  ⚠️ 内部API可能随Node.js版本变化而变化，可能导致兼容性问题!
  `)
  .action((file, options) => {
    // 显示警告信息
    console.warn('\x1b[33m⚠️  警告: 本工具使用Node.js内部API，请勿在生产环境使用!\x1b[0m')

    // 获取除了命令本身和文件路径外的其他参数
    const scriptArgs = process.argv.slice(3).filter(arg =>
      arg !== '--tsx' &&
      arg !== '--ts-node'
    )

    // 准备Node.js参数
    const nodeArgs = ['--expose-internals']

    // 只有在用户明确指定运行器时才添加相关参数
    if (options.tsx) {
      nodeArgs.push('--import', 'tsx')
    } else if (options.tsNode) {
      nodeArgs.push('--require', 'ts-node/register')
    }

    // 添加文件路径和其他参数
    nodeArgs.push(file, ...scriptArgs)

    // 启动子进程
    const nodeProcess = spawn(process.execPath, nodeArgs, {
      stdio: 'inherit',
      env: process.env,
    })

    // 处理进程事件
    nodeProcess.on('error', (err) => {
      console.error(`启动失败: ${err}`)
      process.exit(1)
    })

    nodeProcess.on('exit', (code) => {
      process.exit(code || 0)
    })

    // 处理信号传递
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM']
    signals.forEach(signal => {
      process.on(signal, () => {
        if (!nodeProcess.killed) {
          nodeProcess.kill(signal)
        }
      })
    })
  })

program.parse()
