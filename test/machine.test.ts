import machine from '../src/machine';
import assert from 'assert';

describe('fdta', () => {
    describe('machine', () => {
        it('should process input', () => {
            const input = 'foobar';

            const output = machine(input)
                .register('one', (input, next) => {
                    return next('two');
                })
                .register('two', (input, next) => {
                    return next('end');
                })
                .register('end', (context) => context)
                .run('one');

            assert(input === output);
        });

        it('should exit early', () => {
            const input = {
                i: 0,
            };

            const output = machine(input)
                .register('one', (input, next) => {
                    input.i += 1;

                    return next('two');
                })
                .register('two', (input, next) => {
                    input.i += 1;

                    return next('end');
                })
                .register('three', (input, next) => {
                    input.i += 1;

                    return next('end');
                })
                .register('end', (context) => context)
                .run('one');

            assert(input === output);
            assert(output.i === 2);
        });

        it('should catch error', () => {
            const input = {
                string: 'foo',
            };

            try {
                machine(input)
                    .register('one', (input, next) => {
                        throw Error('foobar');
                    })
                    .register('two', (input, next) => {
                        input.string += 'bar';

                        return next('one');
                    })
                    .run('one');


            } catch (exception) {
                assert(input.string === 'foo');
                assert(exception.message === 'foobar');
            }
        });
    });
});
