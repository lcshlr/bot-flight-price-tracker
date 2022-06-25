const { firefox } = require("playwright");
const { format } = require("date-fns");
const fs = require("fs");
const pathLib = require("path");
const config = require("./config/bot.json");
const mailer = require("./mailer");
const { handleErrors, log } = require("./utils");

const pathSep = pathLib.sep;
const path = pathLib.dirname(require.main.filename) + pathSep;


config.bot.logFilePath = path + config.bot.logFilePath;
config.bot.resultsFilePath = path + config.bot.resultsFilePath;
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
 * Request Kayak.com about a flight to get best price
 */
class KayakBot {

    flights;

    constructor() {
        if(!fs.existsSync(config.bot.resultsFilePath)){
            fs.writeFileSync(config.bot.resultsFilePath, JSON.stringify(defaultValues));
        }

        if(!fs.existsSync(config.bot.screenFolderPath)){
            fs.mkdirSync(config.bot.screenFolderPath);
        }

        this.flights = JSON.parse(fs.readFileSync(config.bot.resultsFilePath));
    }

    getDateFromString(date) {
        const [year, month, day] = date.split("-");
        return new Date(year, month -1, day);
    }

    getPrettyResults() {
        return "New best price found :\n\n" +
        `Best price :\n\tPrice : ${this.flights.bestPrice.price}€\n\tDuration : ${this.flights.bestPrice.duration}\n\tTravel date : ${this.flights.bestPrice.date}\n` +
        `Best choice :\n\tPrix : ${this.flights.bestChoice.price}€\n\tDuration : ${this.flights.bestChoice.duration}\n\tTravel date : ${this.flights.bestChoice.date}\n\n\n` +
        `Date range of research : from ${config.bot.startDate} to ${config.bot.endDate}`;
    }

    async handleResults() {
        try{
            const results = this.getPrettyResults();
            fs.writeFileSync(config.bot.resultsFilePath, JSON.stringify(this.flights));
            log(results);
            if(config.bot.enableMail){
                await mailer.sendMail("New price detected", results);
            }
        } catch(err) {
            log(err?.message ?? err.toString(), "ERROR");
        }
    }

    async handleKayakData(date) {
        let page;
        let hasChanged = false;

        try {
            const context = await this.browser.newContext();
            page = await context.newPage({userAgent: config.browser.userAgents.firefox, });
        
            await page.goto("https://www.kayak.fr/flights/PAR-SGN/"+ date + "-flexible-3days?sort=bestflight_a&fs=legdur=-900;stops=-2", {timeout: 5 * 60 * 1000});

            await page.waitForTimeout(10000);
        
            const getMainInfos = page.locator("[class*=tabGrid]");
        
            const prices = (await getMainInfos.locator(".js-price").allTextContents()).map(price => parseInt(price));
            const durations = (await getMainInfos.locator(".js-duration").allTextContents()).map(duration => duration.trim());
                
            if(prices.length === 0 || durations.length === 0 ){
                throw new Error("No price detected (may be detected as a robot)");
            }

            if(prices[0] < this.flights.bestPrice.price) {
                this.flights.bestPrice.price = prices[0];
                this.flights.bestPrice.duration = durations[0];
                this.flights.bestPrice.date = date;
                hasChanged = true;
            }
             
            if(prices[1] < this.flights.bestChoice.price) {
                this.flights.bestChoice.price = prices[1];
                this.flights.bestChoice.duration = durations[1];
                this.flights.bestChoice.date = date;
                hasChanged = true;
            }
            return hasChanged;
        }
        catch(err) {
            await handleErrors(page, err, `error-${date}`);
        }
        finally {
            await page.close();
        }
    }

    async run() {
        const startScan = Date.now();
        try{
            this.browser = await firefox.launch(config.browser.options);
        } catch(err) {
            log(err, "ERROR");
        }
        const botConfig = config.bot;

        const date = this.getDateFromString(botConfig.startDate);
        const targetDate = this.getDateFromString(botConfig.endDate);

        log(`Looking for best flights from ${botConfig.startDate}(+-3d) to ${botConfig.endDate}(+-3d)`);

        const promises = [];

        while(date  < targetDate) {

            const nextDate = format(date, "yyyy-MM-dd");
            date.setDate(date.getDate() + 5);
            
            promises.push(this.handleKayakData(nextDate));
        }

        // Run all requests asynchronously and store hasChanged value
        const results = (await Promise.allSettled(promises)).map((response) => response.value);
        
        // If one of request get a best price, email sent
        if(results.includes(true)) {
            await this.handleResults();
        }
        const diffTime = Math.abs(Date.now() - startScan);
        const scanDiffMinutes = Math.ceil(diffTime / (1000 * 60));
        log(`Scan time for best flights from ${botConfig.startDate}(+-3d) to ${botConfig.endDate}(+-3d): ${scanDiffMinutes}min`);

        await this.browser.close();
    }
}

module.exports.kayakBot = new KayakBot();