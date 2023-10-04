import * as fs from 'fs'
import path from 'path'

export function localize(locale: string, phrase: string) {
    let rawLocaleFile
    try {
        rawLocaleFile = fs.readFileSync(path.join(__dirname, '..', 'locales', `${locale}.json`), 'utf-8')
    } catch (error) {
        // using english as default
        rawLocaleFile = fs.readFileSync(path.join(__dirname, '..', 'locales', `en.json`), 'utf-8')
    }
    const localizedPhrases = JSON.parse(rawLocaleFile)
    return localizedPhrases[phrase] || phrase
}