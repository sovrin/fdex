import queueFactory from './queue';
import {Transform, TransformCallback} from 'stream';
import {fdex, Queue} from './types';

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
 */
const factory: fdex = (name: string) => {
    const queue = queueFactory();
    const boundary = new Uint8Array(('--' + name)
        .split('')
        .map((char) => char.charCodeAt(0)),
    );
    const data: Buffer[] = [];
    let landmark: Buffer;
    let start;
    const end = Buffer.from(TAIL);

    /**
     *
     * @param queue
     */
    const read = (queue: Queue) => {
        if (!queue.until(boundary)) {
            return;
        }

        landmark = queue.slice(0);

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

        return data;
    };

    /**
     *
     * @param blocks
     * @param push
     */
    const extract = (blocks: Buffer[], push): void => {
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
    function transform(chunk: Buffer, encoding, callback: TransformCallback): void {
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
 * User: Oleg Kamlowski <oleg.kamlowski@thomann.de>
 * Date: 23.09.22
 * Time: 19:56
 */
export default factory;
