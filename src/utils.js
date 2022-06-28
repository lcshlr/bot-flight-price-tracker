const fs = require("fs");
const { format } = require("date-fns");
const config = require("../config/bot.json");
const mailer = require("./mailer");

const log = function log(message,type="INFO"){
    const dateNow = format(Date.now(), "yyyy-MM-dd-HH-mm-ss");
    message = `${dateNow} [${type}] ${message}\n`;
    console.log(message);
    fs.appendFileSync(config.bot.logFilePath, message);
};

const handleErrors = async function(page, err, screenshotName){

    log(err?.message ?? err.toString(),"ERROR");
    try{
        await page.screenshot({ path: `${config.bot.screenFolderPath}${screenshotName}.png` });
        if(config.bot.enableMail){
            await mailer.sendMail("Error occured", err.toString(), screenshotName);
        }
    } catch(err) {
        log(err?.message ?? err.toString(), "ERROR");
    }
};

module.exports.log = log;
module.exports.handleErrors = handleErrors;