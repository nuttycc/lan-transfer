import parseJson, {JSONError} from 'parse-json';

export function isValidJson(str: string) {
  try {
    parseJson(str)
  } catch (e) {
    // console.warn(e)
    return false
  }
  return true
}

