#!/usr/bin/env ts-node

import processArgsToObj from '../programs/processArgsToObj'
import logger from '../utils/logger'

logger.infoWeak(JSON.stringify(processArgsToObj()))
