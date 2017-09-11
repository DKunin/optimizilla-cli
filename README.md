# Script to utilize optmimizilla and avoid the pesky ui

Simple node script, used via cli - to upload and process images via [http://optimizilla.com/](http://optimizilla.com/)

[![NPM](https://nodei.co/npm/optimizilla-cli.png?downloads=true)](https://nodei.co/npm/optimizilla-cli/)

## Install

    npm i optimizilla-cli -g

## Usage


    optimizilla [FILENAME]

    Options
      --output, -o  Destination of the optimized file
      --replace, -r  Replace the original file
      --dry, -d  Dry run, upload, optimize and print out links

    Examples
      $ optimizilla xpto.jpg --output ./ --replace

## RoadMap

- [x] Multiple files upload
- [x] Seperate into helpers
- [ ] Better error checking
- [x] Options
- [x] Help text
- [ ] Tests

## Contribute

PRs accepted.

## Contributors

- [t100n](https://github.com/t100n)

## License

MIT © Dmitri Kunin
