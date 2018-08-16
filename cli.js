#!/usr/bin/env node

const updateNotifier = require('update-notifier');
// Tell user if there's a newer version.
updateNotifier({ pkg: require('./package.json') }).notify({ isGlobal: true });

const os = require('os');
const path = require('path');
const { launch } = require('./lib/launcher.js');

if (process.argv.length > 2 && (process.argv[2] === '-v' || process.argv[2] === '--version')) {
  console.log(`v${require('./package.json').version}`);
  process.exit(0);
}

if (process.argv.length > 2 && process.argv[2] === '--help') {
  console.log('Usage:');
  console.log('');
  console.log('Prepend devmsg in front of binary:');
  console.log('  devmsg npm run start');
  console.log('  devmsg webpack');
  console.log('  devmsg npx webpack');
  console.log('');
  console.log('Launch devmsg standalone:');
  console.log('  devmsg .');
  console.log('');
  process.exit(0);
}

process.on('unhandledRejection', console.log)

const createTerminate = msg => () => {
  console.log('end', msg)
}
;['SIGINT', 'SIGHUP', 'SIGTERM'].forEach(msg => process.on(msg, createTerminate(msg)))

launch({
  globalConfigFile: path.join(os.homedir(), '.devmsg', 'config.js'),
  argv: process.argv,
  cwd: process.cwd(),
  localConfigFile: path.join(process.cwd(), 'devmsg.config.js')
}).then(() => {
  console.log('launched')
});

