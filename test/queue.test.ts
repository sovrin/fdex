import queue from '../src/queue';
import assert from 'assert';

describe('fdex', () => {
    describe('queue', () => {
        const foo = Buffer.from('foo');
        const bar = Buffer.from('bar');

        it('should concat buffer', () => {
            const instance = queue();
            instance.concat(foo);
            instance.concat(bar);

            const buffer = instance.get();

            assert(buffer.equals(Buffer.concat([foo, bar])));
        });

        it('should check buffer', () => {
            const instance = queue();
            instance.concat(foo);

            assert(instance.is(Buffer.from('foo')));
        });

        it('should slice buffer', () => {
            const instance = queue();
            instance.concat(foo);
            instance.concat(bar);

            const a = instance.slice(3);
            const b = instance.slice(3);

            assert(Buffer.from('foo').equals(a));
            assert(Buffer.from('bar').equals(b));
        });

        it('should move till sequence', () => {
            const instance = queue();
            instance.concat(foo);
            instance.concat(bar);

            instance.until(new Uint8Array('foo'.split('').map((c) => c.codePointAt(0))));
            instance.slice(0);

            assert(instance.is(Buffer.from('bar')));
        });

        it('shouldn\'t move till sequence', () => {
            const instance = queue();
            instance.concat(foo);
            instance.concat(bar);

            const result = instance.until(new Uint8Array('fizzbuzz'.split('').map((c) => c.codePointAt(0))));

            assert(result === false);
        });
    });
});
