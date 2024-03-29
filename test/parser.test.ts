import assert from 'assert';
import {compare, load, upload} from './utils';
import parser, {getBoundary} from '../src';

describe('fdex', () => {
    describe('getBoundary', () => {
        it('should return boundary', () => {
            assert(getBoundary('multipart/form-data; boundary=----------879925882887327343332028') === '879925882887327343332028');
            assert(getBoundary('multipart/form-data; boundary=--------------------------879925882887327343332028, foo=bar') === '879925882887327343332028');
            assert(getBoundary('multipart/form-data; boundary=-------foobar') === 'foobar');
            assert(getBoundary('multipart/form-data; fizz=buzz boundary=-------foobar') === 'foobar');
        });

        it('should return null', () => {
            assert(getBoundary('multipart/foo; boundary=-------foobar') === null);
            assert(getBoundary('foo; boundary=-------foobar') === null);
            assert(getBoundary('multipart/form-data; boundary=foobar') === null);
        });
    });

    describe('parser', () => {
        describe('use config', () => {
            it('should should exceed file limit and throw exception', (done) => {
                const [boundary, stream] = upload([['formdata', 'test/fixtures/formdata.txt']]);

                stream.pipe(parser(boundary, {limit: 16}))
                    .on('error', (e) => {
                        assert(e.message === 'limit of 16 bytes exceeded');
                        done();
                    })
                ;
            });
        });

        describe('via file', () => {
            it('should parse nothing with wrong boundary', (done) => {
                let parsed = false;
                load('test/fixtures/rfc7578.txt', 64).pipe(parser('foobar'))
                    .on('data', () => {
                        parsed = true;
                    })
                    .on('end', () => {
                        assert(parsed === false);
                        done();
                    })
                ;
            });

            describe('with tiny buffer', () => {
                it('should parse rfc', (done) => {
                    load('test/fixtures/rfc7578.txt', 8).pipe(parser('AaB03x'))
                        .on('data', ([headers, body]) => {
                            assert(headers['content-disposition'] === 'form-data; name="field1"');
                            assert(headers['content-type'] === 'text/plain;charset=UTF-8');
                            assert(headers['content-transfer-encoding'] === 'quoted-printable');

                            assert(body.toString() === 'Joe owes =E2=82=AC100.');
                        })
                        .on('end', done)
                    ;
                });
            });

            describe('with big buffer', () => {
                it('should parse rfc', (done) => {
                    load('test/fixtures/rfc7578.txt', 1024).pipe(parser('AaB03x'))
                        .on('data', ([headers, body]) => {
                            assert(headers['content-disposition'] === 'form-data; name="field1"');
                            assert(headers['content-type'] === 'text/plain;charset=UTF-8');
                            assert(headers['content-transfer-encoding'] === 'quoted-printable');

                            assert(body.toString() === 'Joe owes =E2=82=AC100.');
                        })
                        .on('end', done)
                    ;
                });
            });

            describe('with several buffer sizes buffer', () => {
                it('should parse formdata', (done) => {
                    let tested = false;
                    load('test/fixtures/formdata.txt', 1024).pipe(parser('upload'))
                        .on('data', ([headers, body]) => {
                            assert(typeof headers['Content-Disposition'] === 'string');
                            assert(body.toString().length > 0);
                            tested = true;
                        })
                        .on('end', (e) => {
                            assert(tested);
                            done(e);
                        })
                    ;
                });

                for (let i = 4; i <= 200; i += 4) {
                    it('should parse form with buffersize: ' + i, (done) => {
                        const expected = [
                            ['form-data; name="foo"', 'bar'],
                            ['form-data; name="json"; filename="foobar.json"', '{"foo":"bar"}'],
                        ];
                        let tested = false;
                        load('test/fixtures/formdata.txt', i).pipe(parser('upload'))
                            .on('data', ([headers, body]) => {
                                const [h, b] = expected.shift();

                                assert(headers['Content-Disposition'] === h);
                                assert(body.toString() === b);
                                tested = true;
                            })
                            .on('end', (e) => {
                                assert(tested);
                                done(e);
                            })
                        ;
                    });
                }
            });
        });

        describe('via form-data', () => {
            it('should parse nothing', (done) => {
                const [boundary, stream] = upload([]);

                let parsed = false;
                stream.pipe(parser(boundary))
                    .on('data', () => {
                        parsed = true;
                    })
                    .on('end', () => {
                        assert(parsed === false);
                        done();
                    })
                ;
            });

            it('should parse text file with kind of random text', (done) => {
                const [boundary, stream, [path]] = upload([['formdata', 'src/index.ts']]);

                stream.pipe(parser(boundary))
                    .on('data', ([headers, body]) => {
                        assert(headers['Content-Disposition'] === 'form-data; name="formdata"');
                        assert(headers['Content-Type'] === 'application/octet-stream');
                        assert(compare(path, body));
                    })
                    .on('end', done)
                ;
            });

            it('should parse text file with formdata', (done) => {
                const [boundary, stream, [path]] = upload([['formdata', 'test/fixtures/formdata.txt']]);

                stream.pipe(parser(boundary))
                    .on('data', ([headers, body]) => {
                        assert(headers['Content-Disposition'] === 'form-data; name="formdata"');
                        assert(headers['Content-Type'] === 'application/octet-stream');
                        assert(compare(path, body));
                    })
                    .on('end', done)
                ;
            });

            it('should parse single binary', (done) => {
                const [boundary, stream, [path]] = upload([['pixel', 'test/fixtures/pixel.png']]);

                stream.pipe(parser(boundary))
                    .on('data', ([headers, body]) => {
                        assert(headers['Content-Disposition'] === 'form-data; name="pixel"');
                        assert(headers['Content-Type'] === 'application/octet-stream');
                        assert(compare(path, body));
                    })
                    .on('end', done)
                ;
            });

            it('should parse several binaries', (done) => {
                const [boundary, stream, [one, two, three]] = upload([
                    ['one', 'test/fixtures/pixel.png'],
                    ['two', 'test/fixtures/pixel.png'],
                    ['three', 'test/fixtures/pixel.png'],
                ]);

                const data = [
                    [
                        ['Content-Disposition', 'form-data; name="one"'],
                        ['Content-Type', 'application/octet-stream'],
                        [one],
                    ],
                    [
                        ['Content-Disposition', 'form-data; name="two"'],
                        ['Content-Type', 'application/octet-stream'],
                        [two],
                    ],
                    [
                        ['Content-Disposition', 'form-data; name="three"'],
                        ['Content-Type', 'application/octet-stream'],
                        [three],
                    ],
                ];

                stream.pipe(parser(boundary))
                    .on('data', ([headers, body]) => {
                        const [disposition, type, path] = data.shift();

                        assert(headers[disposition[0]] === disposition[1]);
                        assert(headers[type[0]] === type[1]);
                        assert(compare(path[0], body));
                    })
                    .on('end', done)
                ;
            });
        });

    });
});
