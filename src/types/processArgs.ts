import * as t from 'io-ts';

export const ProcessArgs = t.type({
  c: t.union([t.string, t.undefined])
})

export type ProcessArgs = t.TypeOf<typeof ProcessArgs>;