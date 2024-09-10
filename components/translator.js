const americanOnly = require('./american-only.js');
const americanToBritishSpelling = require('./american-to-british-spelling.js');
const americanToBritishTitles = require("./american-to-british-titles.js")
const britishOnly = require('./british-only.js')

class Translator {
    convertDataOA(ob) {
        let result = [];

        for (let key of Object.keys(ob)) {
            result.push([key, ob[key]]);
        }

        return result;
    }

    convertDataO(ob) {
        let result = {};

        for (let key of Object.keys(ob)) {
            result[ob[key]] = key;
        }

        return result;
    }

    toCamelCase(text) {
        const data = text.split(' ');
        let result = [];

        for (let e of data) {
            result.push(e.replace(e.charAt(0), e.charAt(0).toUpperCase()));
        }

        return result.join(' ');
    }

    search(text, phrase) {
        if (text.indexOf(phrase.toUpperCase) !== -1) {
            return [text.indexOf(phrase.toUpperCase), 'upper'];
        } else if (text.indexOf(this.toCamelCase(phrase)) !== -1) {
            return [text.indexOf(this.toCamelCase(phrase)), 'camel'];
        } else if (text.toLowerCase().indexOf(phrase.toLowerCase()) !== -1) {
            return [text.toLowerCase().indexOf(phrase.toLowerCase()), 'others'];
        } else {
            return [-1, undefined];
        }
    }

    doesPhraseStart(text, index) {
        if (
            index === 0
            ||
            text[index - 1] === ' '
        ) {
            return true;
        } else {
            return false;
        }
    }

    doesPhraseEnd(text, index, length) {
        const endIndex = index + length - 1;

        if (
            endIndex === text.length - 1
            ||
            text[endIndex + 1].toLowerCase() === text[endIndex + 1].toUpperCase()
        ) {
            return true;
        } else {
            return false;
        }
    }

    restoreResult(phrase, type) {
        switch (type) {
            case 'upper':
                return phrase.toUpperCase();
            case 'camel':
                return this.toCamelCase(phrase);
            case 'others':
                return phrase;
        }
    }

    translate(text, locale) {
        let data;
        let reg = /\d+\:\d+/mg;
        let marks = [':', '.'];

        if (locale === 'american-to-british') {
            data = this.convertDataOA({
                ...americanOnly,
                ...americanToBritishSpelling,
                ...americanToBritishTitles
            });
        } else if (locale === 'british-to-american') {
            data = this.convertDataOA({
                ...britishOnly,
                ...this.convertDataO(americanToBritishSpelling),
                ...this.convertDataO(americanToBritishTitles)
            });
            reg = /\d+\.\d+/mg;
            marks = ['.', ':'];
        } else {
            return undefined;
        }

        let doNext = true;

        while (doNext) {
            for (let e of data) {
                let sResult = this.search(text, e[0]);

                if (
                    sResult[0] !== -1
                    &&
                    this.doesPhraseStart(text, sResult[0])
                    &&
                    this.doesPhraseEnd(text, sResult[0], e[0].length)
                ) {
                    text =
                        text.slice(0, sResult[0])
                        +
                        `<span class="highlight">${this.restoreResult(e[1], sResult[1])}</span>`
                        +
                        text.slice(sResult[0] + e[0].length);
                }
            }

            doNext = false;

            for (let e of data) {
                let sResult = this.search(text, e[0]);

                if (
                    sResult[0] !== -1
                    &&
                    this.doesPhraseStart(text, sResult[0])
                    &&
                    this.doesPhraseEnd(text, sResult[0], e[0].length)
                ) {
                    doNext = true;
                }
            }
        }

        let times = text.match(reg);

        if (times !== null) {
            for (let e of times) {
                text = text.replace(e, `<span class="highlight">${e.replace(marks[0], marks[1])}</span>`);
            }
        }

        return text;
    }
}

module.exports = Translator;