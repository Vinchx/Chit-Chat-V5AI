// Contoh penggunaan EmailService
const EmailService = require('./lib/EmailService');

// Fungsi untuk menguji pengiriman email
async function testEmailService() {
    const emailService = new EmailService();
    
    // Verifikasi koneksi
    const isConnected = await emailService.verifyConnection();
    if (!isConnected) {
        console.error('Gagal terhubung ke server email');
        return;
    }
    
    console.log('Koneksi ke server email berhasil');
    
    // Contoh pengiriman OTP
    const otpResult = await emailService.sendOtpEmail('test@example.com', '123456');
    console.log('Hasil pengiriman OTP:', otpResult);
    
    // Contoh pengiriman forgot password OTP
    const forgotPasswordResult = await emailService.sendForgotPasswordOtp('test@example.com', '654321', 'John Doe');
    console.log('Hasil pengiriman forgot password OTP:', forgotPasswordResult);
    
    // Contoh pengiriman email kustom
    const customEmailResult = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Email Test',
        html: '<h1>Ini adalah email test</h1><p>Email dikirim menggunakan EmailService</p>'
    });
    console.log('Hasil pengiriman email kustom:', customEmailResult);
    
    // Tutup koneksi
    emailService.close();
}

// Jika file ini dijalankan langsung
if (require.main === module) {
    testEmailService().catch(console.error);
}

module.exports = EmailService;