import through2, { TransformFunction } from 'through2'
import Vinyl, { isVinyl } from 'vinyl'
import { getAllSelectors } from '../../extractors/css'
import { flow, pipe } from 'fp-ts/function'
import * as E from 'fp-ts/Either'
import { JSDOM } from 'jsdom'
import fs from 'fs'

type DepsFindIn = {
  html: {
    content: string
  }
}

type SelectorsUsageMap = {
  value: string;
  used: boolean;
}[]

const findInHtml = (deps: DepsFindIn['html'], selectorsMap: SelectorsUsageMap) => {
  const domFragment = JSDOM.fragment(deps.content)

  selectorsMap.forEach(s => {
    if (domFragment.querySelector(s.value)) {
      s.used = true;
    }
  })
}

const findIn = (deps: DepsFindIn) => (selectors: string[]) => pipe(
  selectors.map((s) => ({ value: s, used: false })),
  selectorsMap => {
    if (deps.html) {
      findInHtml(deps.html, selectorsMap)    
    }
  }
)

const mapSelectors = flow(
  getAllSelectors,
  (selectorsRes) =>
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

  return { css, fileName }
};

const getSelectorsFromCss: (b: { css: string; fileName: string }) => E.Either<Error, { selectors: string[]; css: string; fileName: string }> = (obj) => 
  pipe(mapSelectors(obj.css), E.map(selectors => ({ ...obj, selectors })))

const transformFunction: (deps: Deps) => TransformFunction = (deps) =>  (data, _, cb) => pipe(
  cssFileDataToString(data),
  getSelectorsFromCss,
  E.map((obj) => findIn(deps.findIn)(obj.selectors))
)

export const cssOptimization = flow(transformFunction, through2.obj)
