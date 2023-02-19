import { Extractor } from '../types/extractors'
import { StandardResultType } from '../types/results'
import { dataParser } from '../utils/extractors'

type BuilderDeps<D> = { converter: (str: string) => D }

const buildExtractor =
  <D>({ converter }: BuilderDeps<D>): Extractor<D> =>
  (data) => {
    let res: StandardResultType<D> = {
      type: 'error',
      data: new Error('Error while looking for classes in html file.'),
    }

    const resDataParsing = dataParser(data)

    switch (resDataParsing.type) {
      case 'success':
        res = {
          type: 'success',
          data: converter(resDataParsing.data),
        }
        break
      case 'error':
        res = resDataParsing
        break
    }

    return res
  }

export { buildExtractor }
