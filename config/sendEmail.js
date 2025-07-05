const sgMail = require('@sendgrid/mail');

async function sendEmail({ to, subject, text, html }) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const msg = {
        to,
        from: process.env.SENDGRID_FROM_EMAIL, // Your verified sender
        subject,
        text,
        html,
    };
    await sgMail.send(msg);
}

module.exports = sendEmail; 