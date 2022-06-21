const {kayakBot} = require("./src/kayakBot");

async function main(){
    await kayakBot.run();
    console.log("best flight :");
    console.log(kayakBot.bestFlights);
}

main();