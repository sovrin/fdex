import {extname, resolve} from 'path';
import {Readable} from 'stream';
import {createReadStream, readFileSync} from 'fs';
import FormData from 'form-data';

/**
 *
 * @param path
 * @param subject
 */
export const compare = (path: string, subject: Buffer): boolean => {
    return readFileSync(path).equals(subject);
};

/**
 *
 * @param file
 * @param bufferSize
 */
export const load = (file: string, bufferSize: number): Readable => {
    const path = resolve(__dirname, '..', file);

    return createReadStream(path, {
        highWaterMark: bufferSize,
    });
};

/**
 *
 * @param entries
 */
export const upload = (entries?: [string, string][]): [string, Readable, string[]] => {
    const form = new FormData();
    const paths = [];

    for (let [name, value] of entries) {
        if (value && extname(value)) {
            const path = resolve(__dirname, '..', value);
            const stream = readFileSync(path);
            paths.push(path);

            form.append(name, stream);
        } else {
            form.append(name, value);
        }
    }

    return [
        form.getBoundary(),
        Readable.from(form.getBuffer()),
        paths,
    ];
};
