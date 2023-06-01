import { getAllSelectors } from '../../extractors/css'
import { pipe, flow } from 'fp-ts/function'
import * as E from 'fp-ts/Either'
import * as A from 'fp-ts/Array'
import * as AE from '../../utils/ArrayEither'
import { JSDOM } from 'jsdom'
import fs from 'fs'
import { FileInfo, readFilesSync } from '@enrico-dgr/fp-ts-fs'
import path from 'path'
import { Configs } from '../../types/configs'
import { removeExt } from '../../utils/files'

const mapSelectors = flow(getAllSelectors, (selectorsRes) =>
  selectorsRes.type === 'success'
    ? E.right(selectorsRes.data)
    : E.left(selectorsRes.data)
)

const getSelectorsFromCss: (file: {
  content: string
  name: string
}) => E.Either<
  Error,
  { selectors: string[]; content: string; name: string }
> = (file) =>
  pipe(
    mapSelectors(file.content),
    E.map((selectors) => ({ ...file, selectors }))
  )

type SelectorStats = { value: string; used: boolean; msg: string }

const addSelectorsUsage = (o: {
  cssFiles: {
    selectors: SelectorStats[]
    content: string
    name: string
  }[]
  htmlFiles: { name: string; content: string }[]
}) => {
  const domFragments = o.htmlFiles.map((htmlFile) =>
    JSDOM.fragment(htmlFile.content)
  )

  o.cssFiles.forEach((cssFile) => {
    cssFile.selectors.forEach((s) => {
      for (const frag of domFragments) {
        try {
          if (frag.querySelector(s.value)) {
            s.used = true
            break
          }
        } catch (error) {
          const err = error as Error

          s.msg = err.message
        }
      }
    })
  })

  return o
}

const printStats =
  (deps: { html: string; css: string; outputs: { stats: string } }) =>
  (o: {
    cssFiles: {
      selectors: SelectorStats[]
      content: string
      name: string
    }[]
    htmlFiles: {
      name: string
      content: string
    }[]
  }) => {
    if (fs.existsSync(deps.outputs.stats)) {
      o.cssFiles.forEach((file) => {
        const unused = file.selectors
          .filter((s) => !s.used)
          .map((s) => {
            const toPrint: Partial<SelectorStats> = {
              value: s.value,
            }

            if (s.msg) {
              toPrint.msg = s.msg
            }

            return toPrint
          })

        const fileName = removeExt(file.name)

        fs.writeFileSync(
          path.join(deps.outputs.stats, fileName + '.unused-selectors.json'),
          JSON.stringify(unused)
        )
      })
    }
  }

const mapFileInfo = (fileInfos: FileInfo) => ({
  ...fileInfos,
  name: path.basename(fileInfos.path),
})

export default (deps: Configs['optimizeCss']) =>
  pipe(
    readFilesSync({ paths: [deps.css] }),
    E.chain((files) =>
      pipe(
        readFilesSync({ paths: [deps.html] }),
        E.map((htmlFiles) => ({ htmlFiles, cssFiles: files }))
      )
    ),
    E.map(({ htmlFiles, cssFiles }) => ({
      htmlFiles: htmlFiles.map(mapFileInfo),
      cssFiles: cssFiles.map(mapFileInfo),
    })),
    E.map((o) => ({
      ...o,
      cssFiles: o.cssFiles.map(getSelectorsFromCss).map(
        E.match(
          (e) => {
            throw e
          },
          (file) => ({
            ...file,
            selectors: file.selectors.map((s) => ({
              value: s,
              used: false,
              msg: '',
            })),
          })
        )
      ),
    })),
    E.map(addSelectorsUsage),
    E.map(printStats(deps))
  )

export const getFilesByPath = ({
  cssPaths,
  htmlPaths,
}: {
  cssPaths: string[]
  htmlPaths: string[]
}) =>
  pipe(
    readFilesSync({ paths: cssPaths }),
    E.chain((files) =>
      pipe(
        readFilesSync({ paths: htmlPaths }),
        E.map((htmlFiles) => ({ htmlFiles, cssFiles: files }))
      )
    )
  )

export type CssFileInfo = FileInfo & {
  selectors: SelectorStats[]
}

export const buildCssFileInfo = (
  file: FileInfo
): E.Either<Error, CssFileInfo> =>
  pipe(
    mapSelectors(file.content),
    E.map(
      A.map((s) => ({
        value: s,
        used: false,
        msg: '',
      }))
    ),
    E.map((selectors) => ({ ...file, selectors }))
  )

export const setSelectorsUsage = (o: {
  cssFile: CssFileInfo
  htmlFiles: FileInfo[]
}) => {
  const domFragments = o.htmlFiles.map((htmlFile) =>
    JSDOM.fragment(htmlFile.content)
  )

  o.cssFile.selectors.forEach((s) => {
    for (const frag of domFragments) {
      try {
        if (frag.querySelector(s.value)) {
          s.used = true
          break
        }
      } catch (error) {
        const err = error as Error

        s.msg = err.message
      }
    }
  })

  return o
}

export type FileSourcePath = {
  sourceType: 'path'
  paths: string[]
}

export type FileSource = FileSourcePath

type Deps = {
  html: FileSource
  css: FileSource
  filterHtmlToEachCss: (
    currentHtmlFileInfo: FileInfo,
    cssFileInfo: FileInfo
  ) => boolean
}

export const cssOptimize = (deps: Deps) =>
  pipe(
    getFilesByPath({ cssPaths: deps.css.paths, htmlPaths: deps.html.paths }),
    E.chain((files) =>
      pipe(
        files.cssFiles,
        A.map(buildCssFileInfo),
        AE.reduceMap(E.right<Error, CssFileInfo[]>([]), (b, a) => [...b, a]),
        E.map((cssFiles) => ({
          ...files,
          cssFiles,
        }))
      )
    ),
    // Set selectors' usage
    E.map((files) =>
      pipe(
        files.cssFiles,
        A.map(
          (cssFile) =>
            setSelectorsUsage({
              cssFile,
              htmlFiles: files.htmlFiles.filter((file) =>
                deps.filterHtmlToEachCss(file, cssFile)
              ),
            }).cssFile
        ),
        (cssFiles) => ({
          ...files,
          cssFiles,
        })
      )
    ),
    () => 'generate optimized css files by removing unused selectors',
    () => 'print stats if requested'
  )
