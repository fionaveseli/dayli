const expoConfig = require('eslint-config-expo/flat');

module.exports = [...expoConfig, { ignores: ['dist/*', 'design/*', 'node_modules/*', 'mcp/*'] }];
