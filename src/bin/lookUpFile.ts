import fs from 'fs'
import path from 'path'
// import { defaultConfigs } from './constants'
import { Configs } from '../types/configs'

type ResearchResult =
  | {
      type: 'available'
      filePath: string
    }
  | {
      type: 'unavailable'
    }
  | {
      type: 'no-module'
    }

type ParsingResult =
  | {
      type: 'invalid'
      errMsg: string
    }
  | {
      type: 'valid'
      json: Configs
    }

const findStartingWith = (
  dirAbsolutePath: string,
  fileRelativePath: string
): ResearchResult => {
  const file = path.join(dirAbsolutePath, fileRelativePath)

  try {
    fs.statSync(file)

    return {
      type: 'available',
      filePath: file,
    }
  } catch (err) {
    // They are equal for project root dir
    if (path.dirname(dirAbsolutePath) !== dirAbsolutePath) {
      return findStartingWith(path.dirname(dirAbsolutePath), fileRelativePath)
    } else {
      return {
        type: 'unavailable',
      }
    }
  }
}

export const findFileAbsolutePath = (
  fileRelativePath: string
): ResearchResult => {
  let res: ResearchResult = {
    type: 'no-module',
  }

  if (require.main) {
    res = findStartingWith(
      path.dirname(require.main.filename),
      fileRelativePath
    )
  }

  return res
}

const parse = (content: string): ParsingResult => {
  const errMsg = 'Error while parsing configs file.'

  let res: ParsingResult = {
    type: 'invalid',
    errMsg,
  }

  try {
    const json = JSON.parse(content)

    res = {
      type: 'valid',
      json,
    }
  } catch (error) {
    const err = error as Error

    res = {
      type: 'invalid',
      errMsg: errMsg + '\n' + err.message,
    }
  }

  return res
}

const findConfigsFile = (fileRelativePath: string): ParsingResult => {
  // const defaultPath = path.join(process.cwd(), 'css-optimizer')
  // const defaultFileName = 'optimizeCss.configs.json'

  let res: ParsingResult = {
    type: 'invalid',
    errMsg: `Could not find file by path "${fileRelativePath}"`,
  }

  const fileResearchResult = findFileAbsolutePath(fileRelativePath)

  switch (fileResearchResult.type) {
    case 'available':
      const fileContent = fs.readFileSync(fileResearchResult.filePath, 'utf-8')
      res = parse(fileContent)
      break
    case 'unavailable':
      // Commented to return error if configs' file has not been found
      // fs.mkdirSync(defaultPath, { recursive: true })

      // fs.writeFileSync(
      //   path.join(defaultPath, defaultFileName),
      //   JSON.stringify(defaultConfigs, null, '\t')
      // )

      // res = {
      //   type: 'valid',
      //   json: defaultConfigs,
      // }
      break
  }

  return res
}

export { findConfigsFile }
