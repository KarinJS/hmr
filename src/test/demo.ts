import { HMRModule } from '../index'
import './test/1.js'

const hmr = new HMRModule('./src/test/test')

hmr.on('change', (fileUrl, isReload) => {
  console.log(fileUrl, isReload)
  import(fileUrl)
})
