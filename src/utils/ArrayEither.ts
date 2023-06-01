import { pipe } from 'fp-ts/function'
import * as E from 'fp-ts/Either'
import * as A from 'fp-ts/Array'

export const reduceMap = <E, A, B>(b: E.Either<E, B>, f: (b: B, a: A) => B) =>
  A.reduce<E.Either<E, A>, E.Either<E, B>>(b, (_b, a) =>
    pipe(
      _b,
      E.map((__b) => pipe(a, E.reduce(__b, f)))
    )
  )
