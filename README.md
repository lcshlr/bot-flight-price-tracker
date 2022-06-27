# Bot Flight price tracker

## Technologies used

![](https://img.shields.io/badge/-Node.js-339933?style=for-the-badge&logo=Node.js&logoColor=fff)
![](https://img.shields.io/badge/-Javascript-CAB029?style=for-the-badge&logo=Javascript&logoColor=fff)
![](https://img.shields.io/badge/-Playwright-CD5248?style=for-the-badge&logo=Playwright&logoColor=fff)

_Icons from [simpleicons](https://simpleicons.org/)_

Goal of this bot is to request Kayak.com about flights for a date range and notify by mail if a new best price is found.

**Keywords:** Node.js - Bot - Javascript - Playwright

---

## Config

You can customize usage of bot with the config file named _bot.json_ in the **config** folder.

_bot.json_ is composed of **browser** and **bot** sections.

**browser** : options related to Playwright browser

**bot** :

- **flights** : array list of each different journey, structure :
  - **journey** : from airport/to airport (example: PAR-BKK)
  - **start**: journey scan start date (should be seperated by "-" and format should be dd-MM-yyyy, example: "01-06-2022")
  - **end**: journey scan end date (should be seperated by "-" and format should be dd-MM-yyyy, example: "01-06-2022")
- **screenFolderPath**: folder path where screenshots saved (created if not existed)
- **resultsFolderPath**: folder path where best flights files saved (created if not existed)
- **logFilePath**: file path where application logs saved (created if not existed)
- **enableMail**: boolean, if set to true, send results/error mails

If you want to enable mail feature, you must create a mail config to send mail.

Mail config must named _mail.json_ into the **config** folder.

_mail.json_ must follow this structure :

```json
{
  "auth": {
    "email": "YOUR_MAIL_ADDRESS",
    "password": "YOU_MAIL_PASSWORD"
  },
  "recipients": ["LIST_OF", "RECIPIENTS", "ADDRESS"]
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

---

## Contact

<lucas.hilaire.74@gmail.com>
