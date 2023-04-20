import { getAllSelectors } from '../../extractors/css'
import { pipe, flow } from 'fp-ts/function'
import * as E from 'fp-ts/Either'
import { JSDOM } from 'jsdom'
import fs from 'fs'
import readFiles from '../readFiles'
import path from 'path'
import { Configs } from '../../types/configs'
import { removeExt } from '../../utils/files'
// import through2, { TransformFunction } from 'through2'
// import Vinyl, { isVinyl } from 'vinyl'

// type DepsFindIn = {
//   html: {
//     content: string
//   }
// }

// type SelectorsUsageMap = {
//   value: string
//   used: boolean
// }[]

// const findInHtml = (
//   deps: DepsFindIn['html'],
//   selectorsMap: SelectorsUsageMap
// ) => {
//   const domFragment = JSDOM.fragment(deps.content)

//   selectorsMap.forEach((s) => {
//     if (domFragment.querySelector(s.value)) {
//       s.used = true
//     }
//   })
// }

// const findIn = (deps: DepsFindIn) => (selectors: string[]) =>
//   pipe(
//     selectors.map((s) => ({ value: s, used: false })),
//     (selectorsMap) => {
//       if (deps.html) {
//         findInHtml(deps.html, selectorsMap)
//       }
//     }
//   )

const mapSelectors = flow(getAllSelectors, (selectorsRes) =>
  selectorsRes.type === 'success'
    ? E.right(selectorsRes.data)
    : E.left(selectorsRes.data)
)

// type Deps = {
//   findIn: DepsFindIn
// }

// const cssFileDataToString = (data: Buffer | Vinyl) => {
//   let css = ''
//   let fileName = ''

//   if (isVinyl(data)) {
//     fileName = data.basename
//     const contents = data.contents

//     if (contents) {
//       css = contents.toString()
//     }
//   } else if (data instanceof Buffer) {
//     css = data.toString()
//   }

//   return { content: css, name: fileName }
// }

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

// const transformFunction: (deps: Deps) => TransformFunction =
//   (deps) => (data, _, cb) =>
//     pipe(
//       cssFileDataToString(data),
//       getSelectorsFromCss,
//       E.map((obj) => findIn(deps.findIn)(obj.selectors))
//     )

// export const cssOptimization = flow(transformFunction, through2.obj)

type SelectorStats = { value: string; used: boolean, msg: string };

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
            s.used = true;
            break;
          }
        } catch (error) {
          const err = error as Error;

          s.msg = err.message;
        }
      }
    })
  })

  return o
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
            selectors: file.selectors.map((s) => ({ value: s, used: false, msg: '' })),
          })
        )
      ),
    })),
    E.map(addSelectorsUsage),
    E.map((o) => {
      if (fs.existsSync(deps.outputs.stats)) {
        o.cssFiles.forEach((file) => {
          const unused = file.selectors
            .filter((s) => !s.used)
            .map((s) => {
              const toPrint: Partial<SelectorStats> = {
                value: s.value,
              }

              if (s.msg) {
                toPrint.msg = s.msg;
              }

              return toPrint;
            })

          const fileName = removeExt(file.name);

          fs.writeFileSync(
            path.join(deps.outputs.stats, fileName + '.unused-selectors.json'),
            JSON.stringify(unused)
          )
        })
      }
    })
  )
