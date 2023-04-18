import { cssOptimization } from '../programs/optimizeCss'
import { findConfigsFile } from './lookUpFile'

const configs = findConfigsFile('.css-amprc')

switch (configs.type) {
  case 'valid':
    cssOptimization(configs.json)
    break
  case 'invalid':
    console.error(configs.errMsg)
    break
}
