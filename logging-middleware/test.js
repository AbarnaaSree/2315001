const { Log } = require("./logger");

async function main() {

    const response = await Log(
        "backend",
        "info",
        "middleware",
        "Logging middleware initialized"
    );

    console.log(response);
}

main();