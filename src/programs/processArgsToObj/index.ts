import { pipe } from 'fp-ts/lib/function'
import * as A from 'fp-ts/Array'

const processArgsToObj = () =>
  pipe(
    process.argv.slice(2),
    A.filter((arg) => /^--[^-=]*=[^-=]*/.test(arg)),
    A.reduce({}, (b, arg) => {
      const splitted = arg.replace('--', '').split(/(=)/g)

      const [key, _, value] = splitted

      return {
        ...b,
        [key]: value,
      }
    })
  )

export default processArgsToObj
