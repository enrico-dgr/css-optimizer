import { pipe } from 'fp-ts/function'
import * as E from 'fp-ts/Either'
import readFiles from '../src/programs/readFiles'
import writeFile from '../src/programs/writeFile'
import logger from '../src/utils/logger'
import path from 'path'

const CURRENT_PKG = path.resolve(__dirname, '../package.json')
const PKG_OVERRIDE = path.resolve(__dirname, '../package.override.json')
const NEW_PKG = path.resolve(__dirname, '../dist/package.json')

pipe(
  readFiles(CURRENT_PKG),
  E.map((files) => JSON.parse(files[0].content) as {}),
  E.chain((pkgJson) =>
    pipe(
      readFiles(PKG_OVERRIDE),
      E.map((files) => JSON.parse(files[0].content) as {}),
      E.map((pkgJsonOverride) => ({
        ...pkgJson,
        ...pkgJsonOverride,
      }))
    )
  ),
  E.chain((newPkgJson) =>
    writeFile(NEW_PKG, JSON.stringify(newPkgJson, null, '\t'))
  ),
  E.match(logger.onLeft, () => {})
)
