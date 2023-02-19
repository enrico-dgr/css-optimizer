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

export { getClasses }
