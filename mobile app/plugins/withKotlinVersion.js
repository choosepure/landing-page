const { withGradleProperties } = require("expo/config-plugins");

/**
 * Suppress Compose Compiler Kotlin version check via gradle.properties.
 * This sets the flag globally so expo-modules-core compiles without error.
 */
function withKotlinVersion(config) {
  return withGradleProperties(config, (config) => {
    // Remove existing entry if present
    config.modResults = config.modResults.filter(
      (item) =>
        !(item.type === "property" && item.key === "kotlin.suppressKotlinVersionCompatibilityCheck")
    );

    // Add the suppression flag
    config.modResults.push({
      type: "property",
      key: "kotlin.suppressKotlinVersionCompatibilityCheck",
      value: "true",
    });

    return config;
  });
}

module.exports = withKotlinVersion;
