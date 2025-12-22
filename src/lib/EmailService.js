const MailConfig = require("../config/MailConfig");

class EmailService {
    constructor() {
        this.transporter = MailConfig.createTransporter();
    }

    async verifyConnection() {
        try {
            await this.transporter.verify();
            return true;
        } catch (error) {
            console.error('Error verifying email connection:', error);
            return false;
        }
    }

    async sendEmail({ to, subject, html, text = null, attachments = [] }) {
        try {
            const mailOptions = {
                from: {
                    name: process.env.APP_NAME || 'ChitChat',
                    address: process.env.FROM_EMAIL
                },
                to,
                subject,
                html,
                ...(text ? { text } : {}),
                ...(attachments.length ? { attachments } : {})
            };

            const result = await this.transporter.sendMail(mailOptions);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('Error sending email:', error);
            return { success: false, error: error.message };
        }
    }

    async sendOtpEmail(to, otpCode) {
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Kode Verifikasi OTP</h2>
                <p>Terima kasih telah menggunakan layanan kami. Berikut adalah kode OTP Anda:</p>
                <div style="text-align: center; margin: 20px 0;">
                    <span style="font-size: 24px; font-weight: bold; background-color: #f0f0f0; padding: 10px 20px; border-radius: 5px; letter-spacing: 3px;">
                        ${otpCode}
                    </span>
                </div>
                <p>Kode ini berlaku selama 10 menit. Jangan berikan kode ini kepada siapapun.</p>
                <p>Jika Anda tidak meminta kode ini, abaikan email ini.</p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
                <p><small>Email ini dikirim secara otomatis. Mohon tidak membalas email ini.</small></p>
            </div>
        `;
        
        return this.sendEmail({
            to,
            subject: "Kode OTP Verifikasi Email",
            html
        });
    }

    async sendForgotPasswordOtp(to, otpCode, userName) {
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Permintaan Reset Password</h2>
                <p>Halo <strong>${userName}</strong>,</p>
                <p>Kami menerima permintaan untuk mereset kata sandi akun Anda.</p>
                <p>Gunakan kode OTP berikut untuk mereset kata sandi Anda:</p>
                <div style="text-align: center; margin: 20px 0;">
                    <span style="font-size: 24px; font-weight: bold; background-color: #f0f0f0; padding: 10px 20px; border-radius: 5px; letter-spacing: 3px;">
                        ${otpCode}
                    </span>
                </div>
                <p>Kode ini berlaku selama 10 menit. Jika Anda tidak merasa meminta reset password, 
                harap abaikan email ini atau hubungi tim support kami jika Anda merasa ini adalah tindakan yang mencurigakan.</p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
                <p><small>Email ini dikirim secara otomatis. Mohon tidak membalas email ini.</small></p>
            </div>
        `;
        
        return this.sendEmail({
            to,
            subject: "Reset Password - Kode Verifikasi",
            html
        });
    }

    close() {
        if (this.transporter) {
            this.transporter.close();
        }
    }
}

module.exports = EmailService;