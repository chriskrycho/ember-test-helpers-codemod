'use strict';

const {
  createFindAllExpression,
  isJQuerySelectExpression,
  addImportStatement,
  writeImportStatements,
  transformEachsCallbackArgs
} = require('../../utils');
const parser = require('../../parser');

/**
 * Creates a `findAll(selector).forEach()` expression
 *
 * @param j
 * @param findArgs
 * @param eachCallback
 * @returns {*}
 */
function createExpression(j, findArgs, eachCallback) {
  const transformedCallback = transformEachsCallbackArgs(eachCallback);
  return j.callExpression(
    j.memberExpression(
      createFindAllExpression(j, findArgs),
      j.identifier('forEach')
    ), transformedCallback
  );
}

/**
 * Check if `node` is a `this.$(selector).each()` expression
 *
 * @param j
 * @param node
 * @returns {*|boolean}
 */
function isJQueryExpression(j, path) {
  let node = path.node;
  return j.CallExpression.check(node)
    && j.MemberExpression.check(node.callee)
    && isJQuerySelectExpression(j, node.callee.object, path)
    && j.Identifier.check(node.callee.property)
    && node.callee.property.name === 'each';
}

/**
 * Transforms `this.$(selector).each()` to `findAll(selector).forEach()`
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
    .filter((path) => isJQueryExpression(j, path))
    .replaceWith(({ node }) => createExpression(j, node.callee.object.arguments, node.arguments));

  if (replacements.length > 0) {
    addImportStatement(['findAll']);
  }

  writeImportStatements(j, root);
  return root.toSource({ quote: 'single' });
}

module.exports = transform;
