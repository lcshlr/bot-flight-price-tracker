/* eslint-disable no-undef */
const fs = require("fs");
const { format } = require("date-fns");
const config = require("../config/bot.json");
const mailer = require("./mailer");

const log = function log(message,type="INFO", showVpnInfos = false){
    const dateNow = format(Date.now(), "yyyy-MM-dd-HH-mm-ss");
    let vpnInfos = "";
    if(showVpnInfos){
        vpnInfos = process.argv.slice(2);
        vpnInfos = vpnInfos.length > 0 ? `[${vpnInfos}]` : "";
    }
    message = `${dateNow} [${type}] ${message} ${vpnInfos}\n`;
    console.log(message);
    fs.appendFileSync(config.bot.logFilePath, message);
};

const handleErrors = async function(page, err, screenshotName){

    log(err?.message ?? err.toString(),"ERROR");
    try{
        await page.screenshot({ path: `${config.bot.screenFolderPath}${screenshotName}.png` });
        if(config.bot.enableMail){
            await mailer.sendMail({subject: "Error occured", bodyMessage: err.toString(), attachments: screenshotName});
        }
    } catch(err) {
        log(err?.message ?? err.toString(), "ERROR");
    }
};

module.exports.log = log;
module.exports.handleErrors = handleErrors;
