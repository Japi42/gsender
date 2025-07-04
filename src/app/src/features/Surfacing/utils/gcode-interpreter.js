import { parseStringSync } from '../../../lib/GCodeParser';

const noop = () => {};

/**
 * Returns an object composed from arrays of property names and values.
 * @example
 *   fromPairs([['a', 1], ['b', 2]]);
 *   // => { 'a': 1, 'b': 2 }
 */
const fromPairs = (pairs) => {
    let index = -1;
    const length = !pairs ? 0 : pairs.length;
    const result = {};

    while (++index < length) {
        const pair = pairs[index];
        result[pair[0]] = pair[1];
    }

    return result;
};

const partitionWordsByGroup = (words = []) => {
    const groups = [];

    for (let i = 0; i < words.length; ++i) {
        const word = words[i];
        const letter = word[0];

        if (letter === 'G' || letter === 'M' || letter === 'T') {
            groups.push([word]);
            continue;
        }

        if (groups.length > 0) {
            groups[groups.length - 1].push(word);
        } else {
            groups.push([word]);
        }
    }

    return groups;
};

const interpret = (self, data) => {
    const groups = partitionWordsByGroup(data.words);

    for (let i = 0; i < groups.length; ++i) {
        const words = groups[i];
        const word = words[0] || [];
        const letter = word[0];
        const code = word[1];
        let cmd = '';
        let args = {};

        if (letter === 'G') {
            cmd = letter + code;
            args = fromPairs(words.slice(1));

            // Motion Mode
            if (
                code === 0 ||
                code === 1 ||
                code === 2 ||
                code === 3 ||
                code === 38.2 ||
                code === 38.3 ||
                code === 38.4 ||
                code === 38.5
            ) {
                self.motionMode = cmd;
            } else if (code === 80) {
                self.motionMode = '';
            }
        } else if (letter === 'M') {
            cmd = letter + code;
            args = fromPairs(words.slice(1));
        } else if (letter === 'T') {
            // T1 ; w/o M6
            cmd = letter;
            args = code;
        } else if (letter === 'F') {
            // F750 ; w/o motion command
            cmd = letter;
            args = code;
        } else if (
            letter === 'X' ||
            letter === 'Y' ||
            letter === 'Z' ||
            letter === 'A' ||
            letter === 'B' ||
            letter === 'C' ||
            letter === 'I' ||
            letter === 'J' ||
            letter === 'K'
        ) {
            // Use previous motion command if the line does not start with G-code or M-code.
            // @example
            //   G0 Z0.25
            //   X-0.5 Y0.
            //   Z0.1
            //   G01 Z0. F5.
            //   G2 X0.5 Y0. I0. J-0.5
            //   X0. Y-0.5 I-0.5 J0.
            //   X-0.5 Y0. I0. J0.5
            // @example
            //   G01
            //   M03 S0
            //   X5.2 Y0.2 M03 S0
            //   X5.3 Y0.1 M03 S1000
            //   X5.4 Y0 M03 S0
            //   X5.5 Y0 M03 S0
            cmd = self.motionMode;
            args = fromPairs(words);
        }

        if (!cmd) {
            continue;
        }

        if (typeof self.handlers[cmd] === 'function') {
            const func = self.handlers[cmd];
            func(args);
        } else if (typeof self.defaultHandler === 'function') {
            self.defaultHandler(cmd, args);
        }

        if (typeof self[cmd] === 'function') {
            const func = self[cmd].bind(self);
            func(args);
        }
    }
};

class Interpreter {
    motionMode = 'G0';
    handlers = {};

    constructor(options) {
        options = options || {};

        this.handlers = options.handlers || {};
        this.defaultHandler = options.defaultHandler;
    }
    // loadFromStream(stream, callback = noop) {
    //     const s = parseStream(stream, callback);
    //     s.on('data', (data) => {
    //         interpret(this, data);
    //     });
    //     return s;
    // }
    // loadFromFile(file, callback = noop) {
    //     const s = parseFile(file, callback);
    //     s.on('data', (data) => {
    //         interpret(this, data);
    //     });
    //     return s;
    // }
    // loadFromFileSync(file, callback = noop) {
    //     const list = parseFileSync(file);
    //     for (let i = 0; i < list.length; ++i) {
    //         interpret(this, list[i]);
    //         callback(list[i], i);
    //     }
    //     return list;
    // }
    // loadFromString(str, callback = noop) {
    //     const s = parseString(str, callback);
    //     s.on('data', (data) => {
    //         interpret(this, data);
    //     });
    //     return s;
    // }
    loadFromStringSync(str, callback = noop) {
        const list = parseStringSync(str);
        for (let i = 0; i < list.length; ++i) {
            interpret(this, list[i]);
            callback(list[i], i);
        }
        return list;
    }
}

export default Interpreter;
