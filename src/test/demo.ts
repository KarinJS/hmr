import { HMRModule } from '../index'

const hmr = new HMRModule('./src/test/test')

hmr.on('change', (fileUrl, isReload) => {
  console.log(fileUrl, isReload)
  import(fileUrl)
})
