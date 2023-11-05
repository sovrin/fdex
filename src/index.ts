import {Transform, TransformCallback} from 'stream';
import queueFactory from './queue';
import type {Config, fdex, Queue} from './types';

const Char = {
    BOUNDARY: 45,
    RETURN: 13,
    NEW_LINE: 10,
};

const HEAD = new Uint8Array([
    Char.RETURN,
    Char.NEW_LINE,
]);

const TAIL = new Uint8Array([
    Char.BOUNDARY,
    Char.BOUNDARY,
    Char.RETURN,
    Char.NEW_LINE,
]);

const SEPARATOR = new Uint8Array([
    Char.RETURN,
    Char.NEW_LINE,
    Char.RETURN,
    Char.NEW_LINE,
]);

/**
 *
 * @param name
 * @param config
 */
const factory: fdex = (name: string, config?: Config) => {
    let length = 0;
    const queue = queueFactory();
    const boundary = new Uint8Array(('--' + name)
        .split('')
        .map((char) => char.charCodeAt(0)),
    );
    const data: Buffer[] = [];
    let landmark: Buffer;
    let start: Buffer;
    const end = Buffer.from(TAIL);

    /**
     *
     * @param queue
     */
    const read = (queue: Queue): Buffer[] => {
        if (!landmark) {
            if (!queue.until(boundary)) {
                return null;
            }
        }

        if (!landmark) {
            landmark = queue.slice(0);
        }

        if (!start) {
            start = Buffer.concat([
                HEAD,
                landmark,
            ]);
        }

        while (queue.until(start)) {
            const block = queue.slice((start.length) * -1);
            queue.slice(start.length);

            data.push(block);
        }

        if (queue.is(end)) {
            return data;
        }

        return null;
    };

    /**
     *
     * @param blocks
     * @param push
     */
    const extract = (blocks: Buffer[], push: typeof Array.prototype.push): void => {
        for (const block of blocks) {
            const queue = queueFactory();
            queue.concat(block);
            queue.slice(2);

            queue.until(SEPARATOR);

            const header = queue.slice(-4);
            queue.slice(4);

            const body = queue.get();

            push([
                split(header),
                body,
            ]);
        }
    };

    /**
     *
     * @param buffer
     */
    const split = (buffer: Buffer): Record<string, string> => (
        buffer.toString()
            .split(/\r\n/g)
            .map((line) => line.split(/:\s/))
            .reduce((acc, [name, ...rest]) => (
                (acc[name] = rest.join(': ')) && acc
            ), {})
    );

    /**
     *
     * @param chunk
     * @param encoding
     * @param callback
     */
    function transform(chunk: Buffer, encoding: BufferEncoding, callback: TransformCallback): void {
        length += chunk.length;
        if (config?.limit && length > config.limit) {
            callback(new Error(`limit of ${config.limit} bytes exceeded`));

            return;
        }

        queue.concat(chunk);

        const blocks = read(queue);
        if (blocks) {
            extract(blocks, this.push.bind(this));
        }

        callback();
    }

    return new Transform({
        objectMode: true,
        transform,
    });
};

/**
 *
 * @param contentType
 */
const getBoundary = (contentType: string): string => {
    if (!contentType.match(/multipart\/form-data/i)) {
        return null;
    }

    const match = contentType.match(/boundary=--[-?]*(\w+);?/);
    if (!match) {
        return null;
    }

    return match.pop();
};

/**
 * User: Oleg Kamlowski <oleg.kamlowski@thomann.de>
 * Date: 23.09.22
 * Time: 19:56
 */
export default factory;
export {getBoundary};
export type {fdex};
