/* eslint-disable no-undef */
const { firefox } = require("playwright");
const { format } = require("date-fns");
const fs = require("fs");
const pathLib = require("path");
const config = require("../config/bot.json");
const mailer = require("./mailer");
const { handleErrors, log } = require("./utils");

const pathSep = pathLib.sep;
const path = pathLib.dirname(require.main.filename) + pathSep;


config.bot.logFilePath = path + config.bot.logFilePath;
config.bot.resultsFolderPath = path + config.bot.resultsFolderPath;
config.bot.screenFolderPath = path + config.bot.screenFolderPath + pathSep;

const defaultValues = {
    bestChoice: {
        price: 10000,
        duration: "",
        date: ""
    },
    bestPrice: {
        price: 10000,
        duration: "",
        date: ""
    }
};

/**
 * Request Kayak.com about multiple flight destinations to get best price
 */
class KayakBot {

    flights;

    constructor() {
        this.flights = {};
        this.initializeFolders();
    }

    initializeFolders() {
        if(!fs.existsSync(config.bot.resultsFolderPath)){
            fs.mkdirSync(config.bot.resultsFolderPath);
        }

        config.bot.flights.forEach((flight) => {
            const filename = `${config.bot.resultsFolderPath}${pathSep}${flight.journey}.json`;
            if(!fs.existsSync(filename)){
                fs.writeFileSync(filename, JSON.stringify(defaultValues));
            }
            this.flights[flight.journey] = JSON.parse(fs.readFileSync(filename));
        });

        if(!fs.existsSync(config.bot.screenFolderPath)){
            fs.mkdirSync(config.bot.screenFolderPath);
        }
    }
    
    getDateFromString(date) {
        const [day, month, year] = date.split("-");
        return new Date(year, month -1, day);
    }

    getPrettyResults(flight) {
        const journey = flight.journey;
        const getFlight = this.flights[journey];
        let msg = `New best price found for ${journey} :\n\n` +
        `Best price :\n\tPrice : ${getFlight.bestPrice.price}€\n\tDuration : ${getFlight.bestPrice.duration}\n\tTravel date : ${getFlight.bestPrice.date}\n` +
        `Best choice :\n\tPrix : ${getFlight.bestChoice.price}€\n\tDuration : ${getFlight.bestChoice.duration}\n\tTravel date : ${getFlight.bestChoice.date}\n\n\n` +
        `Date range of research : from ${flight.start} to ${flight.end}`;

        // print vpn country and public ip used if given in arguments of script
        const [ vpn, ip ] = process.argv.slice(2);

        if(vpn) {
            msg += `\nVPN Country: ${vpn}`;
        }
        
        if(ip) {
            msg += `\nIP Address: ${ip}`;
        }

        return msg;
    }

    async handleFlightResult(flight) {
        try{
            const journey = flight.journey;
            const results = this.getPrettyResults(flight);
            fs.writeFileSync(`${config.bot.resultsFolderPath}${pathSep}${journey}.json`, JSON.stringify(this.flights[journey]));
            log(results);
            if(config.bot.enableMail){
                const mailOptions = {
                    subject: `${journey} - New price detected`,
                    bodyMessage: results,
                    attachments: `${journey}`,
                    recipients: flight.recipients
                };
                await mailer.sendMail(mailOptions);
            }
        } catch(err) {
            log(err?.message ?? err.toString(), "ERROR");
        }
    }

    async handleKayakData(flight, date) {
        const [year, month, day] = date.split("-");
        const datePrettyFormat = `${day}-${month}-${year}`;
        let page;
        let hasChanged = false;
        let journey = flight.journey;

        try {
            const context = await this.browser.newContext();
            page = await context.newPage({userAgent: config.browser.userAgents.firefox, });
        
            await page.goto("https://www.kayak.fr/flights/"+ journey + "/"+ date + "-flexible-3days?sort=bestflight_a&fs=legdur=-900;stops=-2", {timeout: 5 * 60 * 1000});

            await page.waitForTimeout(10000);
        
            try {
                // decline cookies
                await page.click("[class*=decline] button");
            } catch {/**/}

            const getMainInfos = page.locator("[class*=tabGrid]");
        
            const prices = (await getMainInfos.locator(".js-price").allTextContents()).map(price => parseInt(price));
            const durations = (await getMainInfos.locator(".js-duration").allTextContents()).map(duration => duration.trim());
                
            if(prices.length === 0 || durations.length === 0 ){
                throw new Error("No price detected (may be detected as a robot)");
            }

            if(prices[0] < this.flights[journey].bestPrice.price) {
                this.flights[journey].bestPrice.price = prices[0];
                this.flights[journey].bestPrice.duration = durations[0];
                this.flights[journey].bestPrice.date = datePrettyFormat;
                hasChanged = true;
            }
             
            if(prices[1] < this.flights[journey].bestChoice.price) {
                this.flights[journey].bestChoice.price = prices[1];
                this.flights[journey].bestChoice.duration = durations[1];
                this.flights[journey].bestChoice.date = datePrettyFormat;
                hasChanged = true;
            }

            if(hasChanged){
                await page.screenshot({ path: `${config.bot.screenFolderPath}${journey}.png` });
            }

            await page.close();
            return { hasChanged, flight };
        }
        catch(err) {
            await handleErrors(page, err, `error-${datePrettyFormat}`);
            await page.close();
            // exit process to not send too much error mails
            process.exit(1);
        }
    }

    async run() {
        const startScan = Date.now();
        try{
            this.browser = await firefox.launch(config.browser.options);
        } catch(err) {
            log(err, "ERROR");
        }
        const promises = [];

        // for each destinations
        config.bot.flights.forEach((flight) => {
            log(`Looking for best flights (${flight.journey}) from ${flight.start}(+-3d) to ${flight.end}(+-3d)`);
            const date = this.getDateFromString(flight.start);
            const targetDate = this.getDateFromString(flight.end);

            // while the destination date range is not over
            while(date  < targetDate) {
                const nextDate = format(date, "yyyy-MM-dd");
                date.setDate(date.getDate() + 5);
            
                promises.push(this.handleKayakData(flight, nextDate));
            }
        });

        // Run all requests asynchronously
        (await Promise.allSettled(promises))
            .map(response => response.value)
            .filter(response => response.hasChanged)
            .forEach(async(response) => await this.handleFlightResult(response.flight));

        const diffTime = Math.abs(Date.now() - startScan);
        const scanDiffMinutes = Math.ceil(diffTime / (1000 * 60));
        log(`Scan time for best flights : ${scanDiffMinutes}min`);

        await this.browser.close();
    }
}

module.exports.kayakBot = new KayakBot();