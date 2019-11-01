//testRunner.js
// include node fs module

const fs = require("fs");
const systemSync = require("./executeShellCommand");

function updatePackageConfig(configContents) {
  if (configContents["scripts"]["test"] && (configContents["scripts"]["test"].includes("coverage"))) {
    return "npm run coverage";
  } else {
    return "npm test";
  }
}

function initialSetup() {
  systemSync("mkdir -p /tmp/example/node_modules");
  //Copy over related project files
  //-u, --update copy only when the SOURCE file is newer than the destination file
  //or when the destination file is missing
  systemSync("cp -r -u /var/task/node_modules/* /tmp/example/node_modules");
  systemSync(
    "cp -r -u /var/task/node_modules/.bin /tmp/example/node_modules/.bin"
  );
  systemSync("cp -r -u /var/task/package.json /tmp/example/package.json");
  systemSync("cp -r -u /var/task/jest.config.js /tmp/example/jest.config.js");
}

function testRunner(shownCode, editedCode, hiddenCode) {
  //Setup the lambda environment
  initialSetup();

  let editedCodeNew = `const fetch = require("./node_modules/node-fetch");\n` + editedCode;
  // writeFileSync function with filename, content and callback function
  fs.writeFileSync("/tmp/example/main.js", editedCodeNew, function (err) {
    if (err) throw err;
    console.log("main.js created successfully.");
  });

  //let shownCodeNew = `const fetch = require("./node_modules/node-fetch");\n` + shownCode;
  fs.writeFileSync("/tmp/example/main.spec.js", shownCode, function (err) {
    if (err) throw err;
    console.log("main.spec.js created successfully.");
  });

  let configContents =
    typeof hiddenCode === "string" ? JSON.parse(hiddenCode) : hiddenCode;

  let toTest = updatePackageConfig(configContents);

  let allFeedback = {
    isCorrect: false,
    htmlFeedback: "Default output",
    jsonFeedback: {},
    textFeedback: "Default output"
  };

  switch (toTest) {
    case "npm test":
      let npmTestResults = systemSync("cd /tmp/example; CI=true npm test");
      let npmTestJSONResults = systemSync("cd /tmp/example; CI=true npm run test-json");
      let finalnpmTestJSONResults;
      if (typeof npmTestJSONResults === "string") {
        let lines = npmTestJSONResults.split("\n");
        // remove three lines, starting at the first position
        lines.splice(0, 3);
        // join the array back into a single string
        finalnpmTestJSONResults = JSON.parse(lines.join("\n"));
      } else {
        finalnpmTestJSONResults = npmTestJSONResults;
      }
      let textResults =
        "Total test suites = " +
        finalnpmTestJSONResults.numTotalTestSuites +
        "\nTest suits Passed = " +
        finalnpmTestJSONResults.numPassedTestSuites;
      allFeedback = {
        isCorrect: finalnpmTestJSONResults.success,
        htmlFeedback: (typeof npmTestResults === "string" ? npmTestResults : JSON.stringify(npmTestResults, null, 2)),
        jsonFeedback: finalnpmTestJSONResults,
        textFeedback: textResults
      };
      break;
    case "npm run coverage":
      const npmCoverageResults = systemSync(
        "cd /tmp/example; CI=true npm run coverage"
      );
      let htmlNewResult =
        "<h4>npm run coverage results :- </h4>" +
        (typeof npmCoverageResults === "string"
          ? npmCoverageResults
          : JSON.stringify(npmCoverageResults, null, 2));
      htmlNewResult += systemSync("cat /tmp/example/coverage.txt");
      const npmCoverageJSONResults = systemSync(
        "cd /tmp/example; CI=true npm run jsonCoverage"
      );
      let finalnpmCoverageJSONResults = {};
      if (typeof npmCoverageJSONResults === "string") {
        let lines = npmCoverageJSONResults.split("\n");
        // remove three lines, starting at the first position
        lines.splice(0, 3);
        // join the array back into a single string
        finalnpmCoverageJSONResults = JSON.parse(lines.join("\n"));
      } else {
        finalnpmCoverageJSONResults = npmCoverageJSONResults;
      }
      let textNewResults =
        "Total test suites = " +
        finalnpmCoverageJSONResults.numTotalTestSuites +
        "\nTest suits Passed = " +
        finalnpmCoverageJSONResults.numPassedTestSuites;
      allFeedback = {
        isCorrect: finalnpmCoverageJSONResults.success,
        htmlFeedback: htmlNewResult,
        jsonFeedback: finalnpmCoverageJSONResults,
        textFeedback: textNewResults
      };
      break;
    default:
      break;
  }

  return allFeedback;
}
module.exports = testRunner;
