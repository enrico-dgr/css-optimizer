import { pipe } from 'fp-ts/function'
import * as A from 'fp-ts/Array'
import * as E from 'fp-ts/Either'
import fs from 'fs'
import path from 'path'
import { cssOptimize } from '../../src/programs/optimizeCss'

describe('Optimize Css', () => {
  const mocksBasePath = path.resolve(__dirname, '../mocks')
  const outputBaseDir = path.resolve(__dirname, '../outputs')

  const res = cssOptimize({
    css: {
      sourceType: 'path',
      paths: [path.join(mocksBasePath, '**', '.*.css')],
    },
    html: {
      sourceType: 'path',
      paths: [path.join(mocksBasePath, '**', '.*.html')],
    },
    filterHtmlToEachCss: (html, css) => {
      const splitted = path.dirname(css.path).split(path.sep)
      const dirname = splitted[splitted.length - 1]
      const cssInclusionPath = dirname + '/' + css.name
      return html.content.search(cssInclusionPath) > -1
    },
  })

  it('Output', () => {
    pipe(
      res,
      E.map((files) => files.cssFiles),
      E.map(
        A.map((cssFile) => {
          const relative = path.relative(
            mocksBasePath,
            path.dirname(cssFile.path)
          )
          const filename = path
            .basename(cssFile.path)
            .replace(/\.([^\.]*)$/, '.optimized.$1')

          let outputDir = path.resolve(outputBaseDir, relative)
          fs.mkdirSync(outputDir, { recursive: true })

          const outputFilePath = path.join(outputDir, filename)

          expect(outputFilePath).toMatch(/css$/)

          const expectedOptimized = fs.readFileSync(outputFilePath, {
            encoding: 'utf8',
          })
          expect(cssFile.content).toBe(expectedOptimized)
        })
      )
    )
  })
})
