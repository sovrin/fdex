<h1 align="left">fdex</h1>

[![npm version][npm-src]][npm-href]
[![types][types-src]][types-href]
[![size][size-src]][size-href]
[![coverage][coverage-src]][coverage-href]
[![vulnerabilities][vulnerabilities-src]][vulnerabilities-href]
[![dependencies][dep-src]][dep-href]
[![License][license-src]][license-href]

> small form-data extractor

## Installation

```bash
$ npm i fdex
```

## Usage

```js
import fdex, {getBoundary} from 'fdex';
import express from 'express';

const app = express();

app.post('/', (req) => {
    const contentType = req.headers['content-type'];
    const boundary = getBoundary(contentType);

    const extractor = fdex(boundary);
    req.pipe(extractor)
        .on('data', ([headers, body]) => {
            console.info(headers, body);
        })
    ;
});

app.listen(3000);
```

## About

Jet another `multipart/form-data` extractor/processor.
This projects aim was to understand and process the `multipart/form-data` format without any
additional dependencies.

## Licence

MIT License, see [LICENSE](./LICENSE)

[npm-src]: https://badgen.net/npm/v/fdex

[npm-href]: https://www.npmjs.com/package/fdex

[size-src]: https://badgen.net/packagephobia/install/fdex

[size-href]: https://packagephobia.com/result?p=fdex

[types-src]: https://badgen.net/npm/types/fdex

[types-href]: https://www.npmjs.com/package/fdex

[coverage-src]: https://coveralls.io/repos/github/sovrin/fdex/badge.svg?branch=master

[coverage-href]: https://coveralls.io/github/sovrin/fdex?branch=master

[vulnerabilities-src]: https://snyk.io/test/github/sovrin/fdex/badge.svg

[vulnerabilities-href]: https://snyk.io/test/github/sovrin/fdex

[dep-src]: https://img.shields.io/librariesio/release/npm/fdex

[dep-href]: https://img.shields.io/librariesio/release/npm/fdex

[license-src]: https://badgen.net/github/license/sovrin/fdex

[license-href]: LICENSE
