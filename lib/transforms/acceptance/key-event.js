'use strict';

const { makeAwait, dropAndThen, addImportStatement, writeImportStatements } = require('../../utils');
const parser = require('../../parser');

/**
 * Check if `node` is a `keyEvent(...)` expression
 *
 * @param j
 * @param node
 * @returns {*|boolean}
 */
function isGlobalHelperExpression(j, node) {
  return j.CallExpression.check(node)
    && j.Identifier.check(node.callee)
    && node.callee.name === 'keyEvent';
}

/**
 * Transform `keyEvent(...)` to `await keyEvent(...)`, remove `andThen` calls
 *
 * @param file
 * @param api
 * @returns {*|string}
 */
function transform(file, api) {
  let source = file.source;
  let j = parser(api);

  let root = j(source);

  let replacements = root
      .find(j.CallExpression)
      .filter(({ node }) => isGlobalHelperExpression(j, node))
    ;

  if (replacements.length > 0) {
    makeAwait(j, replacements);
    dropAndThen(j, root);
    addImportStatement(['keyEvent']);
  }

  writeImportStatements(j, root);
  return root.toSource({ quote: 'single' });
}

module.exports = transform;
