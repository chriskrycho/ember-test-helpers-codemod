'use strict';

const { addImportStatement, writeImportStatements } = require('../../utils');
const parser = require('../../parser');

const importMigrations = [
  'click',
  'find',
  'findAll',
  'fillIn',
  'focus',
  'blur',
  'triggerEvent',
  ['keyEvent', 'triggerKeyEvent'],
  'waitFor',
  'waitUntil',
  'currentURL',
  'currentRouteName',
  'visit'
];
const importMigrationsLookup = importMigrations.reduce((result, specifier) => {
  let key = specifier;
  let value = specifier;
  if (Array.isArray(specifier)) {
    key = specifier[0];
    value = specifier[1];
  }
  return Object.assign(result, { [key]: value });
}, {});

function renameCallee(j, root, name, newName) {
  root
    .find(j.CallExpression, {
      callee: {
        name
      }
    })
    .forEach(({ node }) => node.callee.name = newName);
}

/**
 * Transform imports from ember-native-dom-helpers to @ember/test-helpers
 *
 * @param file
 * @param api
 * @returns {*|string}
 */
function transform(file, api) {
  let source = file.source;
  let j = parser(api);
  let root = j(source);

  let nativeDomImportStatements = root.find(j.ImportDeclaration, {
    source: { value: 'ember-native-dom-helpers' }
  });
  if (nativeDomImportStatements.length === 0) {
    return root.toSource({ quote: 'single' });
  }

  let newImports = [];

  nativeDomImportStatements.forEach((importStatement) => {
    let oldSpecifiers = importStatement.get('specifiers');

    let newSpecifiers = [];
    oldSpecifiers.each(({ node: specifier }) => {
      let importedName = specifier.imported.name;
      if (importedName in importMigrationsLookup) {
        let mappedName = importMigrationsLookup[importedName];
        // @todo local != imported
        // let localName = specifier.local.name;
        newImports.push(mappedName);
        if (importedName !== mappedName) {
          renameCallee(j, root, importedName, mappedName);
        }
      } else {
        newSpecifiers.push(specifier);
      }
    });

    if (newSpecifiers.length > 0) {
      oldSpecifiers.replace(newSpecifiers);
    } else {
      importStatement.prune();
    }
  });

  addImportStatement(newImports);
  writeImportStatements(j, root);
  return root.toSource({ quote: 'single' });
}

module.exports = transform;
