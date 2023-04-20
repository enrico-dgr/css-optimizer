import { getAllSelectors } from '../../extractors/css'
import { pipe, flow } from 'fp-ts/function'
import * as E from 'fp-ts/Either'
import { JSDOM } from 'jsdom'
import fs from 'fs'
import readFiles from '../readFiles'
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

export default (deps: Configs['optimizeCss']) =>
  pipe(
    readFiles(deps.css),
    E.chain((files) =>
      pipe(
        readFiles(deps.html),
        E.map((htmlFiles) => ({ htmlFiles, cssFiles: files }))
      )
    ),
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
