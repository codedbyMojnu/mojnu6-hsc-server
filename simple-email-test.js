require('dotenv').config();
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

sgMail.send({
    to: 'thisismojnu@gmail.com',
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: 'Test',
    text: 'Hello from SendGrid!',
}).then(() => {
    console.log('Email sent');
}).catch((error) => {
    console.error(error);
});