function systemSync(cmd) {
  try {
    console.log("running: ", cmd)
    var child_process = require("child_process");
    const output = child_process.execSync(cmd, { encoding: "utf-8" }).toString();
    console.log("ran:", cmd)
    return output
  } catch (error) {
    return error.output[1];
    //error.status;  // Holds the error status code
    //error.message; // Holds the message you typically want.
    //error.stderr;  // Holds the stderr output. Use `.toString()`.
    //error.stdout;  // Holds the stdout output. Use `.toString()`.
  }
}
module.exports = systemSync;
