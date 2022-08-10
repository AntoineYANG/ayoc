/*
 * @Author: Kanata You 
 * @Date: 2022-01-24 17:59:40 
 * @Last Modified by: Kyusho
 * @Last Modified time: 2022-08-04 19:13:28
 */
'use strict';

const fs = require('fs');
const env = require('espoir-cli/env').default;

const { name: appName } = require('../../package.json');

const envVarsFile = env.resolvePathInPackage(
  appName,
  'configs',
  'env.json'
);

const loadEnvVars = isDev => {
  if (fs.existsSync(envVarsFile)) {
    return {
      ...Object.fromEntries(
        Object.entries(require(envVarsFile)).map(([k, v]) => {
          return [k, JSON.stringify(v)];
        })
      ),
      __DEV__: `${isDev}`,
      __PROD__: `${!isDev}`,
    };
  }

  return {};
};


module.exports = loadEnvVars;
