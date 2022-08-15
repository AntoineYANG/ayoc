/*
 * @Author: Kanata You 
 * @Date: 2022-01-24 15:46:57 
 * @Last Modified by: Kyusho
 * @Last Modified time: 2022-08-15 18:38:20
 */
'use strict';

// initialize
const init = require('./utils/init');
init('prod');

const path = require('path');
const fs = require('fs-extra');
const { execSync } = require('child_process');
const chalk = import('chalk').then(mod => mod.default);
const env = require('espoir-cli/env').default;

const {
  analyzeProduct,
  differStats
} = require('./utils/analyze-product');
const formatTime = require('./utils/format-time');


const { name: appName } = require('../package.json');
const paths = require('../configs/path.json');

const {
  compilerOptions: {
    outDir,
    declarationDir,
  }
} = require(env.resolvePathInPackage(appName, paths.rootDir, 'tsconfig.json'));

const rootPath = env.resolvePathInPackage(appName, paths.rootDir);

const outputPath = env.resolvePathInPackage(appName, paths.rootDir, outDir);
const declPath = env.resolvePathInPackage(appName, paths.rootDir, declarationDir);

const tmpDir = env.resolvePathInPackage(appName, paths.rootDir, 'temp');
const outputPathTmp = path.join(tmpDir, outDir);
const declPathTmp = path.join(tmpDir, declarationDir);

const prepareOutputDir = async () => {
  const prevStats = analyzeProduct(outputPath);
  
  // clear output directory
  fs.emptyDirSync(outputPath);

  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, {
      recursive: true,
      force: true,
    });
  }

  return prevStats;
};

const pickExportFiles = () => {
  fs.mkdirSync(tmpDir);

  fs.copySync(
    path.join(outputPath, 'ayoc'),
    outputPathTmp, {
      dereference: true,
    }
  );

  fs.copySync(
    path.join(declPath, 'ayoc'),
    declPathTmp, {
      dereference: true,
    }
  );

  fs.rmSync(outputPath, {
    recursive: true,
    force: true,
  });

  fs.copySync(
    outputPathTmp,
    path.join(outputPath, 'src'), {
      dereference: true,
    }
  );

  fs.copySync(
    declPathTmp,
    path.join(outputPath, 'typings'), {
      dereference: true,
    }
  );

  fs.rmSync(tmpDir, {
    recursive: true,
    force: true,
  });

  for (const name of fs.readdirSync(rootPath).filter(name => /^(package\.json|.*\.md)$/.test(name))) {
    const source = path.join(rootPath, name);
    const target = path.join(outputPath, name);

    fs.copySync(
      source,
      target,
    );
  }
};

const runBuild = async prevStats => {
  await chalk.then(async _chalk => {
    console.log(
      _chalk.blue('Start building...')
    );

    const startTime = Date.now();

    execSync('tsc');

    pickExportFiles();

    const endTime = Date.now();

    console.log(
      _chalk.green('Completed.')
    );

    console.log(
      `${
        _chalk.yellowBright('Total cost: ')
      }${
        _chalk.green(
          formatTime(endTime - startTime)
        )
      }`
    );

    const curStats = analyzeProduct(outputPath);

    await differStats(prevStats, curStats);

    console.log(
      `\nReady to publish.`
    );
  });

  console.log();
};


const webpackBuild = async () => {
  const prevStats = await prepareOutputDir();

  await runBuild(prevStats);

  return 0;
};


if (require.main === module) {
  webpackBuild().then(process.exit);
}


module.exports = webpackBuild;
