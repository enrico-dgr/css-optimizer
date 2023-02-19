import { filters } from '../utils/arrays'
import { buildExtractor } from './builders'

const htmlToClasses = (str: string): string[] => {
  const res: string[] = []

  const matchRes = str.match(/(?:class=['"])[^'"]*(?:['"])/g)

  if (matchRes) {
    res.push(
      ...matchRes
        .flatMap((m) =>
          m
            .replace(/(class=)?['"]/, '')
            .split(' ')
            .filter((cl) => cl !== '')
        )
        .filter(filters.removeDuplicates)
    )
  }

  return res
}

const getClasses = buildExtractor({
  converter: htmlToClasses,
})

export { getClasses }
