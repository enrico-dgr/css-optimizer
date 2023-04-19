import * as t from 'io-ts'

export const formatError = (e: t.ValidationError) =>
  `${e.message}\nCurrent value: ${e.value}\nat ${e.context}`

export const formatErrors = (errors: t.Errors): string =>
  `${errors.length} error(s) found:\n${errors.map(formatError).join('\n\n')}`
