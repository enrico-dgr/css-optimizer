import { StandardResultType } from './results'

export type Data = string | Buffer

export type Extractor<D extends any> = (data: Data) => StandardResultType<D>
