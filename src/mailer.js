const nodemailer = require("nodemailer");
const fs = require("fs");
const mailConfig = require("../config/mail.json");
const config = require("../config/bot.json");

class Mailer {
    constructor(){
        this.transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: mailConfig.auth.email,
                pass: mailConfig.auth.password
            }
        });

        this.mailOptions = {
            from: mailConfig.auth.user,
            to: "",
            subject: "[KayaBot]",
            text: ""
        };
    }

    async sendMail(subject, bodyMessage, attachments) {
        const mailOptions = {...this.mailOptions};  
        mailOptions.subject = `${this.mailOptions.subject} ${subject}`;
        mailOptions.text = bodyMessage;

        if(attachments && fs.existsSync(`${config.bot.screenFolderPath}${attachments}.png`)){
            mailOptions.attachments = [{
                filename: attachments + ".png",
                path: `${config.bot.screenFolderPath}${attachments}.png`,
                contentType: "image/png"
            }];
        }
      
        mailOptions.to = mailConfig.recipients;
        await this.transporter.sendMail(mailOptions);
    } 
}

module.exports = new Mailer();