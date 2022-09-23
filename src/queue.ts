import {Queue} from './types';

/**
 *
 */
const factory = (): Queue => {
    let buffer: Buffer = Buffer.from([]);
    let cursor = 0;

    /**
     *
     * @param subject
     */
    const until = (subject: Uint8Array): boolean => {
        const index = buffer.indexOf(subject, cursor);
        if (index === -1) {
            return false;
        }

        cursor = index + subject.length;

        return true;
    };

    /**
     *
     * @param subject
     */
    const is = (subject: Buffer): boolean => {
        return buffer.equals(subject);
    };

    /**
     *
     * @param chunk
     */
    const concat = (chunk: Buffer): Queue => {
        buffer = Buffer.concat([buffer, chunk]);

        return context();
    };

    /**
     *
     * @param length
     */
    const slice = (length: number): Buffer => {
        const diff = buffer.slice(0, cursor + length);

        buffer = buffer.slice(cursor + length, buffer.length);
        cursor = 0;

        return diff;
    };

    /**
     *
     */
    const get = (): Buffer => {
        return buffer;
    };

    /**
     *
     */
    const context = (): Queue => ({
        concat,
        slice,
        until,
        is,
        get,
    });

    return context();
};

/**
 * User: Oleg Kamlowski <oleg.kamlowski@thomann.de>
 * Date: 23.09.22
 * Time: 19:44
 */
export default factory;
