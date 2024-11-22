const esbuild = require('esbuild');

const externalDependencies = ['knex', 'uuidv7'];

const build = async () => {
  await Promise.all([
    // CommonJS build
    esbuild.build({
      entryPoints: ['./src/index.ts'],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      outfile: './dist/cjs/index.js',
      sourcemap: true,
      external: externalDependencies,
    }),
    // ESModule build
    esbuild.build({
      entryPoints: ['./src/index.ts'],
      bundle: true,
      platform: 'neutral',
      format: 'esm',
      outfile: './dist/esm/index.js',
      sourcemap: true,
      external: externalDependencies,
    }),
  ]);
};

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
