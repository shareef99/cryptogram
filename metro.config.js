// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Bundle the prebuilt SQLite database (assets/db/cryptogram.db) as an asset so
// it can be `require()`d and copied to the device on first launch.
config.resolver.assetExts.push('db');

module.exports = config;
