import optimizeCss from '../programs/optimizeCss'
import { pipe } from 'fp-ts/function'
import * as E from 'fp-ts/Either'
import { findConfigsFile } from './lookUpFile'
import { Configs } from '../types/configs'
import { formatErrors } from '../utils/reporter'

pipe(
  findConfigsFile('optimizeCss.configs.json'),
  (configs) =>
    configs.type === 'valid' ? E.right(configs.json) : E.left(configs.errMsg),
  E.chain((configs) =>
    pipe(
      Configs.props.optimizeCss.decode(configs.optimizeCss),
      E.mapLeft(formatErrors)
    )
  ),
  E.mapLeft(msg => new Error(msg)),
  E.chain(optimizeCss),
  E.match(
    e => {
      const stack = e.stack?.replace(/^[^\n]*\n/,'') ?? '';

      console.error('\x1b[31m%s\x1b[0m', `Error: ${e.message}`, `\n${stack}`)},
    () => {}
  )
)
