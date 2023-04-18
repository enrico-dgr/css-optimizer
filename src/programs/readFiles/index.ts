import { pipe } from 'fp-ts/lib/function'
import fs from 'fs'
import * as E from 'fp-ts/Either'

const recogniseGlobType = (
  pattern: string
): E.Either<Error, 'replace-dir' | 'replace-matching-file'> => {
  if (pattern === '**') {
    return E.right('replace-dir')
  } else if (!pattern.includes('*')) {
    return E.right('replace-matching-file')
  } else {
    return E.left(new Error('No valid glob'))
  }
}

const replaceDir = (o: {
  indexOfFirstGlob: number
  splittedPath: string[]
}): string[] => {
  let basePath = ''
  let dirNames = []
  const paths = []

  if (o.indexOfFirstGlob === 0) {
    basePath = '/'
  } else {
    basePath = o.splittedPath.slice(0, o.indexOfFirstGlob).join('/') + '/'
  }

  dirNames.push(
    ...fs
      .readdirSync(basePath, { withFileTypes: true })
      .filter((item) => item.isDirectory())
      .map((directory) => directory.name)
  )
  paths.push(...dirNames.map((dirName) => basePath + dirName))

  return paths
}

const replaceFileName = (o: {
  indexOfFirstGlob: number
  splittedPath: string[]
}): string[] => {
  let basePath = ''
  let dirNames = []
  const paths = []

  if (o.indexOfFirstGlob === 0) {
    basePath = '/'
  } else {
    basePath = o.splittedPath.slice(0, o.indexOfFirstGlob).join('/') + '/'
  }

  const fileRegex = new RegExp(
    o.splittedPath[o.indexOfFirstGlob].replace('*', '.*')
  )

  dirNames.push(
    ...fs
      .readdirSync(basePath, { withFileTypes: true })
      .filter((item) => item.isFile() && item.name.search(fileRegex) > -1)
      .map((file) => file.name)
  )

  paths.push(...dirNames.map((dirName) => basePath + dirName))

  return paths
}

const iterateThroughGlob = (o: {
  indexOfFirstGlob: number
  splittedPath: string[]
}): E.Either<Error, string[]> =>
  pipe(
    recogniseGlobType(o.splittedPath[o.indexOfFirstGlob]),
    E.map((globType) => {
      let paths = []

      switch (globType) {
        case 'replace-dir':
          paths.push(...replaceDir(o))
          break
        case 'replace-matching-file':
          paths.push(...replaceFileName(o))
          break
        default:
          break
      }

      return paths
    }),
    E.map((paths) =>
      paths
        .map((path) => queryPathAll(path))
        .flatMap(
          E.match(
            (e) => {
              throw e
            },
            (r) => r
          )
        )
    )
  )

// get first base dir
// starts overriding glob values
// check each iteration by recursively building the whole path of the file
const queryPathAll = (globPath: string): E.Either<Error, string[]> =>
  pipe(
    {
      splittedPath: globPath.split(/[\\\/]/),
    },
    ({ splittedPath }) => ({
      splittedPath,
      indexOfFirstGlob: splittedPath.findIndex((v) => v.includes('*')),
    }),
    (o) =>
      o.indexOfFirstGlob < 0 ? E.right([globPath]) : iterateThroughGlob(o)
  )

export default () => {}
