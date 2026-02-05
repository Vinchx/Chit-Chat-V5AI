import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Simple health check - return 200 if server is running
        return NextResponse.json(
            {
                status: 'ok',
                timestamp: new Date().toISOString(),
                service: 'Chit-Chat V5AI'
            },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            {
                status: 'error',
                message: error.message
            },
            { status: 500 }
        );
    }
}
