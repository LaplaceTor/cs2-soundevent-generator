import fs from 'fs';
import path from 'path';
import { rollup } from 'rollup';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import replace from '@rollup/plugin-replace';
import alias from '@rollup/plugin-alias';
import { babel } from '@rollup/plugin-babel';
import postcss from 'rollup-plugin-postcss';

async function build() {
  console.log('Starting pure JS Rollup build...');

  const distDir = path.resolve('dist');
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(distDir, { recursive: true });

  // Copy public files
  const publicDir = path.resolve('public');
  if (fs.existsSync(publicDir)) {
    fs.cpSync(publicDir, distDir, { recursive: true });
  }

  const bundle = await rollup({
    input: path.resolve('src/main.tsx'),
    plugins: [
      alias({
        entries: [
          { find: '@', replacement: path.resolve('src') },
        ],
      }),
      replace({
        preventAssignment: true,
        'process.env.NODE_ENV': JSON.stringify('production'),
      }),
      resolve({
        extensions: ['.mjs', '.js', '.json', '.node', '.ts', '.tsx'],
        browser: true,
      }),
      babel({
        babelHelpers: 'bundled',
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        presets: [
          ['@babel/preset-react', { runtime: 'automatic', development: false }],
          '@babel/preset-typescript',
        ],
      }),
      commonjs(),
      json(),
      postcss({
        extract: 'assets/index.css',
        minimize: true,
      }),
    ],
  });

  const { output } = await bundle.write({
    dir: distDir,
    format: 'es',
    entryFileNames: 'assets/[name]-[hash].js',
    chunkFileNames: 'assets/[name]-[hash].js',
    assetFileNames: 'assets/[name]-[hash][extname]',
  });

  await bundle.close();

  // Find generated JS and CSS filenames
  const jsFile = output.find((chunk) => chunk.type === 'chunk' && chunk.isEntry)?.fileName || 'assets/main.js';
  const cssFile = output.find((chunk) => chunk.type === 'asset' && chunk.fileName.endsWith('.css'))?.fileName || 'assets/index.css';

  // Read index.html template and inject
  let html = fs.readFileSync('index.html', 'utf8');
  html = html.replace(
    '<script type="module" src="/src/main.tsx"></script>',
    `<link rel="stylesheet" href="./${cssFile}" />\n    <script type="module" src="./${jsFile}"></script>`
  );
  fs.writeFileSync(path.join(distDir, 'index.html'), html, 'utf8');

  console.log('Build completed successfully!');
}

build().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
