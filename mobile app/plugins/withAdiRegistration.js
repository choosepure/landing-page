const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo config plugin that copies adi-registration.properties into the
 * Android app's assets folder so it appears at assets/adi-registration.properties
 * inside the final APK (required for Play Store app ownership verification).
 */
module.exports = function withAdiRegistration(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const androidAssetsDir = path.join(
        projectRoot,
        'android',
        'app',
        'src',
        'main',
        'assets'
      );

      // Ensure the assets directory exists
      if (!fs.existsSync(androidAssetsDir)) {
        fs.mkdirSync(androidAssetsDir, { recursive: true });
      }

      // Copy the adi-registration.properties file
      const sourceFile = path.join(projectRoot, 'assets', 'adi-registration.properties');
      const destFile = path.join(androidAssetsDir, 'adi-registration.properties');

      if (fs.existsSync(sourceFile)) {
        fs.copyFileSync(sourceFile, destFile);
        console.log('✅ Copied adi-registration.properties to android assets');
      } else {
        console.warn('⚠️ adi-registration.properties not found in assets/');
      }

      return config;
    },
  ]);
};
