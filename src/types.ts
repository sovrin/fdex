import {Transform} from 'stream';

export type fdex = (boundary: string) => Transform;

export type Queue = {
    until(subject: Uint8Array): boolean,
    concat(buffer: Buffer): Queue,
    slice(length: number): Buffer,
    is(subject: Buffer): boolean,
    get(): Buffer,
}
