import { myProgram } from 'src'
import { findConfigsFile } from './lookUpFile'

const configs = findConfigsFile('.css-amprc')

switch (configs.type) {
  case 'valid':
    myProgram(configs.json)
    break
  case 'invalid':
    console.error(configs.errMsg)
    break
}
