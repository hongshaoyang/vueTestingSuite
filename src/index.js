const fs = require("fs");
const testRunner = require("./testRunner");

exports.handler = async event => {
  process.env.PATH =
    process.env.PATH + ":" + process.env.LAMBDA_TASK_ROOT + "/bin";
  // const indexPage = fs.readFileSync('./index.html', 'utf8');

  // redirect via 301 Moved Permanently
  if (event.httpMethod === "GET") {
    return {
      statusCode: 301,
      headers: {
        "Location": "https://justussoh.github.io/BT3103-P2J/"
      }
    };
  }

  if (event.httpMethod === "POST") {
    const parsedBodyContent = JSON.parse(event.body);
    const shownCode = parsedBodyContent["shown"]["0"];
    const editedCode = parsedBodyContent["editable"]["0"];
    const hiddenCode = parsedBodyContent["hidden"]["0"];

    let allFeedback;
    try {
      allFeedback = testRunner(shownCode, editedCode, hiddenCode);
    } catch (error) {
      allFeedback = null;
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        isComplete: allFeedback["isCorrect"],
        jsonFeedback: allFeedback["jsonFeedback"],
        htmlFeedback: allFeedback["htmlFeedback"],
        textFeedback: allFeedback["textFeedback"]
      })
    };
  }
};
