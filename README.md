# Script to utilize optmimizilla and avoid the pesky ui

AlphaStage, currently works only with one file per session.

Simple node script, used via cli - to upload and process images via [http://optimizilla.com/](http://optimizilla.com/)

## Install

    npm i optimizilla-cli -g

## Usage


    optimizilla [FILENAME]

    Options
      --output, -o  Destination of the optimized file
      --replace, -r  Replace the original file

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

## Contributers

- [t100n](https://github.com/t100n)

## License

MIT © Dmitri Kunin
