# Bot Flight price tracker

Goal of this bot is to request Kayak.com about flights for a date range and detect notify by mail if a new best price is found.

## Config

  You can customize usage of bot with the config file named *bot.json* in the **config** folder.

  *bot.json* is composed of **browser** and **bot** sections.

  **browser** : options related to Playwright browser
  
  **bot** : 
- startDate: bot scan start date
- endDate: bot scan end date
- screenFolderPath: folder path where screenshots saved (created if not existed)
- resultsFilePath: file path where best flights saved (created if not existed)
- logFilePath: file path where application logs saved (created if not existed)
- enableMail: boolean, if set to true, send results/error mails

If you want to enable mail feature, you must create a mail config to send mail.

Mail config must named *mail.json* into the **config** folder.

*mail.json* must follow this structure :
```json
{
  "auth": {
    "email": "YOUR_MAIL_ADDRESS",
    "password": "YOU_MAIL_PASSWORD"
  },
  "recipients": ["LIST_OF","RECIPIENTS","ADDRESS"]
}
```

## Install

Run the following command at the root of project:
```bash
npm install
```

## Run project

Run the following command at the root of project:
```bash
npm start
```