#!/usr/bin/env ts-node

import optimizeCss from '../programs/optimizeCss'
import { pipe } from 'fp-ts/function'
import * as E from 'fp-ts/Either'
import { findConfigsFile } from './lookUpFile'
import { Configs } from '../types/configs'
import { formatErrors } from '../utils/reporter'
import logger from '../utils/logger'
import processArgsToObj from '../programs/processArgsToObj'
import { ProcessArgs } from '../types/processArgs'

pipe(
  processArgsToObj(),
  ProcessArgs.decode,
  E.mapLeft(formatErrors),
  E.map((args) => findConfigsFile(args.c || 'fixtures/optimizeCss.configs.json')),
  E.chain((configs) =>
    configs.type === 'valid' ? E.right(configs.json) : E.left(configs.errMsg)
  ),
  E.chain((configs) =>
    pipe(
      Configs.props.optimizeCss.decode(configs.optimizeCss),
      E.mapLeft(formatErrors)
    )
  ),
  E.mapLeft((msg) => new Error(msg)),
  E.chain(optimizeCss),
  E.match(
    logger.onLeft,
    () => {}
  )
)
