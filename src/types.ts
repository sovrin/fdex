import {Transform} from 'stream';

export type fdex = (boundary: string, config?: Config) => Transform;

export type Config = {
    limit?: number,
}

export type Queue = {
    until(subject: Uint8Array): boolean,
    concat(buffer: Buffer): Queue,
    slice(length: number): Buffer,
    is(subject: Buffer): boolean,
    get(): Buffer,
}
