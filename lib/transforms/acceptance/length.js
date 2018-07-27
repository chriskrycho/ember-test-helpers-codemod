'use strict';

const { createFindAllExpression, isFindExpression, addImportStatement, writeImportStatements } = require('../../utils');
const parser = require('../../parser');

/**
 * Creates a `findAll(selector).length` expression
 *
 * @param j
 * @param findArgs
 * @returns {*}
 */
function createExpression(j, findArgs) {
  return j.memberExpression(
    createFindAllExpression(j, findArgs),
    j.identifier('length')
  );
}

/**
 * Check if `node` is a `this.$(selector).length` expression
 *
 * @param j
 * @param node
 * @returns {*|boolean}
 */
function isJQueryExpression(j, node) {
  return j.MemberExpression.check(node)
    && isFindExpression(j, node.object)
    && j.Identifier.check(node.property)
    && node.property.name === 'length';
}

/**
 * Transforms `this.$(selector).length` to `findAll(selector).length`
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
    .find(j.MemberExpression)
    .filter(({ node }) => isJQueryExpression(j, node))
    .replaceWith(({ node }) => createExpression(j, node.object.arguments));

  if (replacements.length > 0) {
    addImportStatement(['findAll']);
  }

  writeImportStatements(j, root);
  return root.toSource({quote: 'single'});
}

module.exports = transform;
