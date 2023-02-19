import { Data } from '../types/extractors'
import { StandardResultType } from '../types/results'

const dataObjToStr = (d: Object): StandardResultType<string> => {
  let resFromObj: StandardResultType<string> = {
    type: 'error',
    data: new Error('Data object is not valid.', {
      cause: d,
    }),
  }

  if (d instanceof Buffer) {
    resFromObj = {
      type: 'success',
      data: d.toString(),
    }
  }

  return resFromObj
}

const dataParser = (data: Data): StandardResultType<string> => {
  typeof data === 'string' ? data : data.toString()
  let res: StandardResultType<string> = {
    type: 'error',
    data: new Error('Cannot parse data into a string.'),
  }

  switch (typeof data) {
    case 'string':
      res = {
        type: 'success',
        data: data,
      }
      break
    case 'object':
      res = dataObjToStr(data)
      break
    default:
      break
  }

  return res
}

export { dataParser }
