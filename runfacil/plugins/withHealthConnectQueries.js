// Adds the Health Connect package to AndroidManifest <queries> so the app can
// detect/launch Health Connect via getSdkStatus() on Android 13 and below
// (package visibility, Android 11+). On Android 14+ Health Connect is part of
// the framework and this is a no-op.
const { withAndroidManifest } = require('@expo/config-plugins');

const HEALTH_CONNECT_PACKAGE = 'com.google.android.apps.healthdata';

const withHealthConnectQueries = (config) =>
  withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    if (!Array.isArray(manifest.queries)) {
      manifest.queries = [];
    }
    const alreadyDeclared = manifest.queries.some((q) =>
      q.package?.some((p) => p.$?.['android:name'] === HEALTH_CONNECT_PACKAGE)
    );
    if (!alreadyDeclared) {
      manifest.queries.push({
        package: [{ $: { 'android:name': HEALTH_CONNECT_PACKAGE } }],
      });
    }
    return cfg;
  });

module.exports = withHealthConnectQueries;
