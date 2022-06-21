module.exports =  {
    "browser": {
        "options": {
            "headless": true
        },
        "userAgents": {
            "firefox": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:101.0) Gecko/20100101 Firefox/101.0"
        }
    },
    "bot": {
        "startDate": "2022-11-15",
        "endDate": "2022-12-15",
        "durationBetweenRequestsCall": 5,
        "screen_paths": "./snapshots/"
    }
};