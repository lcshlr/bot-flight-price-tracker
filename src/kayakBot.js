const { chromium } = require("playwright");
const {format} = require("date-fns");
const config = require("../config");

/**
 * Request Kayak.com about a flight to get best price
 */

class KayakBot {

    bestFlights;

    constructor() {
        this.bestFlights =  {
            choice: {
                price: 1000000,
                duration: "",
                date: ""
            },
            price : {
                price: 1000000,
                duration: "",
                date: ""
            }
        };
    }

    getDateFromString(date) {
        const [year, month, day] = date.split("-");
        return new Date(year, month -1, day);
    }

    async run() {
        const browser = await chromium.launch(config.browser.options);

        const botConfig = config.bot;

        const date = this.getDateFromString(botConfig.startDate);
        const targetDate = this.getDateFromString(botConfig.endDate);

        while(date  < targetDate) {

            const nextDate = format(date, "yyyy-MM-dd");
            let page;
            date.setDate(date.getDate() + botConfig.durationBetweenRequestsCall);
        
        
            try{
                console.log(`Looking for best flights for date ${nextDate} +-3d`);
                const context = await browser.newContext();
                page = await context.newPage({userAgent: config.browser.userAgents.firefox, });
        
                await page.goto("https://www.kayak.fr/flights/PAR-SGN/"+ nextDate + "-flexible-3days?sort=bestflight_a&fs=legdur=-900;stops=-2");

                await page.waitForTimeout(10000);
        
                const getMainInfos = page.locator("[class*=tabGrid]");
        
                const prices = (await getMainInfos.locator(".js-price").allTextContents()).map((price) => parseInt(price));
                const durations = await getMainInfos.locator(".js-duration").allTextContents();

                if(prices[0] < this.bestFlights.price.price) {
                    this.bestFlights.price.price = prices[0];
                    this.bestFlights.price.duration = durations[0];
                    this.bestFlights.price.date = nextDate;
                }
             
                if(prices[1] < this.bestFlights.choice.price) {
                    this.bestFlights.choice.price = prices[1];
                    this.bestFlights.choice.duration = durations[1];
                    this.bestFlights.choice.date = nextDate;
                }

            } catch(err) {
                console.error(err);
                await page.screenshot({path: botConfig.screen_paths + "screens-" + nextDate
                });
            
            }
            finally {
                await page.close();
            }
        }
        await browser.close();
    }
}

module.exports.kayakBot = new KayakBot();