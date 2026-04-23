const { withProjectBuildGradle, withAppBuildGradle } = require("expo/config-plugins");

/**
 * Custom Expo config plugin for react-native-razorpay and Kotlin/Compose fixes.
 * - Adds the Razorpay Maven repository to project-level build.gradle
 * - Suppresses Kotlin version compatibility check for Compose compiler
 */
function withRazorpay(config) {
  // Step 1: Add Razorpay Maven repo to project-level build.gradle
  config = withProjectBuildGradle(config, (config) => {
    const buildGradle = config.modResults.contents;

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

  // Step 2: Suppress Kotlin version compatibility check in app-level build.gradle
  config = withAppBuildGradle(config, (config) => {
    const buildGradle = config.modResults.contents;

    if (!buildGradle.includes("suppressKotlinVersionCompatibilityCheck")) {
      // Add the Compose compiler option to suppress the Kotlin version check
      const kotlinOptionsBlock = `
android {
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.15"
    }
}

tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
    kotlinOptions {
        freeCompilerArgs += ["-P", "plugin:androidx.compose.compiler.plugins.kotlin:suppressKotlinVersionCompatibilityCheck=1.9.24"]
    }
}
`;
      config.modResults.contents = buildGradle + "\n" + kotlinOptionsBlock;
    }

    return config;
  });

  return config;
}

module.exports = withRazorpay;
