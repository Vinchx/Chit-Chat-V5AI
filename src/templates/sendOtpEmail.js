function otpTemplate(otpCode) {
    return `
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
}

module.exports = otpTemplate;