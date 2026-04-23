const { withProjectBuildGradle } = require("expo/config-plugins");

/**
 * Custom Expo config plugin for react-native-razorpay.
 * Adds the Razorpay Maven repository to the project-level build.gradle.
 */
function withRazorpay(config) {
  return withProjectBuildGradle(config, (config) => {
    const buildGradle = config.modResults.contents;

    // Add Razorpay maven repo if not already present
    if (!buildGradle.includes("maven.razorpay.com")) {
      config.modResults.contents = buildGradle.replace(
        /allprojects\s*\{[\s\S]*?repositories\s*\{/,
        (match) =>
          match +
          `\n            maven { url "https://maven.razorpay.com/release/" }\n`
      );
    }

    return config;
  });
}

module.exports = withRazorpay;
