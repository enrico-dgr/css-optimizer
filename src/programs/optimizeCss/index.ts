import through2, { TransformFunction } from 'through2'
import Vinyl, { isVinyl } from 'vinyl'
import { getAllSelectors } from '../../extractors/css'
import { flow, pipe } from 'fp-ts/function'
import * as E from 'fp-ts/Either'
import { JSDOM } from 'jsdom'
import fs from 'fs'
import readFiles from '../readFiles'

type DepsFindIn = {
  html: {
    content: string
  }
}

type SelectorsUsageMap = {
  value: string
  used: boolean
}[]

const findInHtml = (
  deps: DepsFindIn['html'],
  selectorsMap: SelectorsUsageMap
) => {
  const domFragment = JSDOM.fragment(deps.content)

  selectorsMap.forEach((s) => {
    if (domFragment.querySelector(s.value)) {
      s.used = true
    }
  })
}

const findIn = (deps: DepsFindIn) => (selectors: string[]) =>
  pipe(
    selectors.map((s) => ({ value: s, used: false })),
    (selectorsMap) => {
      if (deps.html) {
        findInHtml(deps.html, selectorsMap)
      }
    }
  )

const mapSelectors = flow(getAllSelectors, (selectorsRes) =>
  selectorsRes.type === 'success'
    ? E.right(selectorsRes.data)
    : E.left(selectorsRes.data)
)

type Deps = {
  findIn: DepsFindIn
}

const cssFileDataToString = (data: Buffer | Vinyl) => {
  let css = ''
  let fileName = ''

  if (isVinyl(data)) {
    fileName = data.basename
    const contents = data.contents

    if (contents) {
      css = contents.toString()
    }
  } else if (data instanceof Buffer) {
    css = data.toString()
  }

  return { content: css, name: fileName }
}

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

const transformFunction: (deps: Deps) => TransformFunction =
  (deps) => (data, _, cb) =>
    pipe(
      cssFileDataToString(data),
      getSelectorsFromCss,
      E.map((obj) => findIn(deps.findIn)(obj.selectors))
    )

export const cssOptimization = flow(transformFunction, through2.obj)

const addSelectorsUsage = (o: {
  cssFiles: {
    selectors: { value: string; used: boolean }[]
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
      const matches = domFragments.map((fragment) =>
        fragment.querySelector(s.value)
      )

      for (const match of matches) {
        if (match) {
          s.used = true
          break
        }
      }
    })
  })

  return o
}

export default (deps: { html: string; css: string }) =>
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
            selectors: file.selectors.map((s) => ({ value: s, used: false })),
          })
        )
      ),
    })),
    E.map(addSelectorsUsage)
  )
