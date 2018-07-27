'use strict';

const { addImportStatement, writeImportStatements } = require('../../utils');
const parser = require('../../parser');

/**
 * Check if `node` is a currentURL, currentPath, currentRouteName call
 *
 * @param j
 * @param node
 * @returns {*|boolean}
 */
function isRouteHelperExpression(j, node, type) {
  return j.CallExpression.check(node)
    && j.Identifier.check(node.callee)
    && node.callee.name === type;
}

/**
 * Add import statements for currentURL, currentPath, currentRouteName
 *
 * @param file
 * @param api
 * @returns {*|string}
 */
function transform(file, api) {
  let source = file.source;
  let j = parser(api);

  let root = j(source);

 [
   'currentURL',
   'currentPath',
   'currentRouteName'
 ].forEach(function(type) {
   if (root
       .find(j.CallExpression)
       .filter(({ node }) => isRouteHelperExpression(j, node, type))
       .length > 0) {
     addImportStatement([type]);
   }
 });

  writeImportStatements(j, root);
  return root.toSource({ quote: 'single' });
}

module.exports = transform;
