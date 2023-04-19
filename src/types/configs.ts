import * as t from 'io-ts';

export const Configs = t.type({
  optimizeCss: t.type({
    html: t.string,
    css: t.string,
    outputs: t.type({ stats: t.string })
  })
})

export type Configs = t.TypeOf<typeof Configs>;