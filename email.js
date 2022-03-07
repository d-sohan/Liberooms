require('dotenv').config();

const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendMail = async (msg) => {
    try {
        await sgMail.send(msg);
        console.log("Message sent successfully");
    }
    catch (err) {
        console.error(err);
        if (err.response) {
            console.error(err.response.body);
        }
    }
};


sendMail({
    to: "f20180848@hyderabad.bits-pilani.ac.in",
    from: process.env.SENDER,
    subject: "Hello",
    text: "Hello, world"
});

