function forgotPasswordOtpTemplate(otpCode, userName) {
    return `
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
}

module.exports = forgotPasswordOtpTemplate;