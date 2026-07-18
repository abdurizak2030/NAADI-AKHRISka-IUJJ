import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: ['.next/**', 'node_modules/**', 'uploads/**', 'next-env.d.ts'],
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_' },
      ],
      // This app intentionally renders arbitrary hot-linked/admin-provided
      // image URLs with unknown dimensions (see next.config.mjs
      // images.remotePatterns). Migrating every <img> to next/image would
      // require adding explicit width/height or fill+wrapper markup at each
      // call site, which changes layout/CLS behavior — out of scope here.
      '@next/next/no-img-element': 'off',
    },
  },
];

export default eslintConfig;
