import { CssFileInfo } from './index'

export const standardToAmp = (cssFile: CssFileInfo): CssFileInfo => {
  cssFile.content = cssFile.content.replace(/ *!important */g, '')

  return cssFile
}
