// DEPRECATED: Endpoint ini tidak dipakai lagi karena sudah migrasi ke NextAuth
// Login sekarang dilakukan via NextAuth di /api/auth/signin
// File ini dibiarkan untuk backward compatibility, tapi tidak akan digunakan

export async function POST(request) {
    return Response.json({
        success: false,
        message: "Endpoint /api/login sudah tidak dipakai. Gunakan NextAuth untuk login di browser, atau API key untuk testing Postman.",
        info: {
            browser: "Login otomatis via NextAuth session di /auth",
            postman: "Gunakan header x-api-key dan x-user-id untuk testing"
        }
    }, { status: 410 }); // 410 Gone - endpoint deprecated
}
