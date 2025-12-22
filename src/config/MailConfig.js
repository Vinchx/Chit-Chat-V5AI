const nodemailer = require('nodemailer');

class MailConfig {
    static validateConfig() {
        const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
        const missing = required.filter(envVar => !process.env[envVar]);

        if (missing.length > 0) {
            console.warn(`Peringatan: Variabel lingkungan berikut hilang: ${missing.join(', ')}`);
            return false;
        }
        return true;
    }

    static createTransporter() {
        if (!this.validateConfig()) {
            throw new Error('Konfigurasi SMTP tidak lengkap');
        }

        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            tls: {
                rejectUnauthorized: process.env.NODE_ENV === 'production'
            }
        });
    }
}

module.exports = MailConfig;