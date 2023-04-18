import { filters } from '../utils/arrays'
import { buildExtractor } from './builders'

const cssToClasses = (str: string): string[] => {
  const res: string[] = []

  const matchRes = str
    // Remove comments to avoid bad matches
    .replace(/\/\*.*\*\//g, '')
    // Find selectors
    .match(/\.[^\}]+\{/g)

  if (matchRes) {
    res.push(
      ...matchRes
        .map((m) =>
          m
            // Remove pseudo selectors
            .replace(/:[^\{,:]*( \.|\.|\{|,)/g, ' $1')
            // Remove attributes
            .replace(/\[[^\]]*\]/g, '')
            // Remove elements
            .replace(/[,\{ ~>+][^\., ]*/g, '') // @todo `{` is useful?
            // Prepare to split
            .replace(/[,\{ ~>+]/g, '')
            .split('.')
        )
        .reduce((pm, cm) => [...pm, ...cm], [])
        .filter(
          (...args) => args[0] !== '' && filters.removeDuplicates(...args)
        )
    )
  }

  return res
}

const getClasses = buildExtractor({
  converter: cssToClasses,
})

const cssToSelectors = (css: string): string[] => {
  // Match everything between "}" and "{", with no "{", "}", "@" or "/",
  // where the last one is for comments
  const matches = css.match(/\}[^\{\}@\/]*\{/g) ?? []

  const mapMatch = (m: string) => m.replace(/[\{\}]/g, '').split(',')

  return matches.flatMap(mapMatch)
}

const getAllSelectors = buildExtractor({
  converter: cssToSelectors,
})

export { getClasses, getAllSelectors }
