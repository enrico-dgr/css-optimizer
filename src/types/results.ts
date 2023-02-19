interface Result<T extends string, D extends any> {
  type: T
  data: D
}

export type StandardResultType<D extends any> =
  | Result<'error', Error>
  | Result<'success', D>
