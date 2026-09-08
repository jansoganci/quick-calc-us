import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import importX from 'eslint-plugin-import-x'

export default tseslint.config(
  { ignores: ['node_modules/**', 'docs/**', 'dist/**', 'coverage/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'import-x': importX },
    settings: {
      // imports carry explicit .ts/.tsx extensions in this project
      'import-x/resolver-next': [importX.createNodeResolver({ extensions: ['.ts', '.tsx'] })],
    },
    rules: {
      'import-x/no-cycle': 'error',
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      // Pinned to the two classic hook rules. The plugin's own `recommended`
      // preset additionally enables the React Compiler rule set, which is a
      // separate decision and not part of this dependency upgrade.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'react', message: 'core must stay React-free.' },
            { name: 'react-dom', message: 'core must stay React-free.' },
          ],
          patterns: [
            { group: ['**/features/**'], message: 'core must not import the feature layer.' },
            { group: ['**/components/**'], message: 'core must not import UI components.' },
            { group: ['**/data/**'], message: 'core must not import benchmark data.' },
          ],
        },
      ],
    },
  },
)
