import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
    try {
        if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
            throw new Error('SMTP_EMAIL and SMTP_PASSWORD environment variables are required');
        }

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD,
            },
        });

        await transporter.verify();

        const message = {
            from: `${process.env.FROM_NAME || 'Online Judge'} <${process.env.FROM_EMAIL || process.env.SMTP_EMAIL}>`,
            to: options.email,
            subject: options.subject,
            text: options.message,
        };

        const info = await transporter.sendMail(message);

        return info;
    } catch (error) {
        throw new Error(`Failed to send email: ${error.message}`);
    }
};

export default sendEmail; 