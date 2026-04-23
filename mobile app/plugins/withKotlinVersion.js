const { withProjectBuildGradle } = require("expo/config-plugins");

/**
 * Force Kotlin version to 1.9.25 to match what expo-modules-core's
 * Compose Compiler 1.5.15 expects.
 * 
 * This modifies the project-level build.gradle to override the Kotlin
 * version used across all modules.
 */
function withKotlinVersion(config) {
  return withProjectBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    // Add a buildscript block that forces Kotlin 1.9.25 if not already present
    if (!contents.includes("ext.kotlinVersion")) {
      const injection = `
buildscript {
    ext.kotlinVersion = "1.9.25"
    dependencies {
        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:\${ext.kotlinVersion}"
    }
}
`;
      // Prepend to the file so it takes effect before other buildscript blocks
      config.modResults.contents = injection + contents;
    }

    return config;
  });
}

module.exports = withKotlinVersion;
