// Try to load the TS-ready parser. (Do it here so we only do it once, rather
// than executing the `require` every time. It's cached, but there's still no
// reason to do it more than once.)
let parser;
try {
  parser = require('recast/parsers/typescript');
} catch (e) {
  // eslint-disable-next-line
  console.log('Could not load typescript aware parser, falling back to standard recast parser...');
}

module.exports = function parser(api) {
  return parser ? api.jscodeshift.withParser(parser) : api.jscodeshift;
}