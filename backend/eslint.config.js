import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    languageOptions: {
      parserOptions: {
        // Disambiguate the TSConfig root when the monorepo is linted from an IDE.
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
