import { pipe } from 'fp-ts/function'
import * as E from 'fp-ts/Either'
import { assignJson } from '@enrico-dgr/fp-ts-fs'
import logger from '../src/utils/logger'
import path from 'path'

const CURRENT_PKG = path.resolve(__dirname, '../package.json')
const PKG_OVERRIDE = path.resolve(__dirname, '../package.override.json')
const NEW_PKG = path.resolve(__dirname, '../dist/package.json')

pipe(
  assignJson({
    paths: [CURRENT_PKG, PKG_OVERRIDE],
    output: NEW_PKG,
    options: { format: true },
  }),
  E.match(logger.error, () => {})
)
