import connectToDatabase from "@/lib/mongodb";
import mongoose from "mongoose";
import { getAuthSessionOrApiKey } from "@/lib/auth-helpers";

export async function POST(request) {
    try {
        // 1. Check authentication
        const { session, userId, error } = await getAuthSessionOrApiKey(request);

        if (error) {
            return error;
        }

        const currentUserId = userId;

        // 2. Ambil data pesan yang mau dikirim
        const { roomId, message, messageType = "text", attachment, replyTo, senderId: customSenderId } = await request.json();
        console.log("📝 DATA RECEIVED:", { roomId, message, messageType, attachment, replyTo, currentUserId, customSenderId });

        // Validate: must have roomId and either message or attachment
        if (!roomId) {
            return Response.json({
                success: false,
                message: "Room ID harus diisi"
            }, { status: 400 });
        }

        if (!message && !attachment) {
            return Response.json({
                success: false,
                message: "Pesan atau attachment harus diisi"
            }, { status: 400 });
        }

        // 3. Sambung ke database
        await connectToDatabase();
        const db = mongoose.connection.db;
        const roomsCollection = db.collection("rooms");
        const messagesCollection = db.collection("messages");

        // 4. Cek apakah room ada dan user punya akses
        const room = await roomsCollection.findOne({ _id: roomId });

        if (!room) {
            return Response.json({
                success: false,
                message: "Room tidak ditemukan"
            }, { status: 404 });
        }

        // Cek apakah user adalah member dari room ini
        if (!room.members.includes(currentUserId)) {
            return Response.json({
                success: false,
                message: "Kamu bukan member room ini"
            }, { status: 403 });
        }

        // 5. Buat message ID
        const messageCount = await messagesCollection.countDocuments();
        const messageId = `msg${String(messageCount + 1).padStart(6, '0')}`;

        // 5.5. Validate replyTo if provided
        if (replyTo && replyTo.messageId) {
            const repliedMessage = await messagesCollection.findOne({ _id: replyTo.messageId });
            if (!repliedMessage) {
                return Response.json({
                    success: false,
                    message: "Pesan yang ingin dibalas tidak ditemukan"
                }, { status: 404 });
            }
            // Note: We allow replying to deleted messages, but the UI will show it as deleted
        }

        // 6. Simpan pesan ke database
        // Use customSenderId for AI messages, otherwise use currentUserId
        const finalSenderId = customSenderId || currentUserId;

        const newMessage = {
            _id: messageId,
            roomId: roomId,
            senderId: finalSenderId,
            message: message || (attachment ? `[${attachment.type === 'image' ? 'Image' : 'File'}]` : ''),
            messageType: messageType,
            timestamp: new Date(),
            isEdited: false,
            isDeleted: false
        };

        // Add attachment if provided
        if (attachment) {
            newMessage.attachment = {
                type: attachment.type,
                url: attachment.url,
                filename: attachment.filename,
                size: attachment.size,
                mimeType: attachment.mimeType
            };
        }

        // Add replyTo if provided
        if (replyTo && replyTo.messageId) {
            newMessage.replyTo = {
                messageId: replyTo.messageId,
                text: replyTo.text || '',
                sender: replyTo.sender || '',
                attachment: replyTo.attachment || null
            };
        }

        await messagesCollection.insertOne(newMessage);

        // 7. Update last activity dan last message di room
        const lastMessageText = message || (attachment ? `📎 ${attachment.filename}` : '');
        await roomsCollection.updateOne(
            { _id: roomId },
            {
                $set: {
                    lastMessage: lastMessageText.substring(0, 50), // Ambil 50 karakter pertama
                    lastActivity: new Date()
                }
            }
        );

        // 8. 🤖 AI COMMAND DETECTION: Check if message starts with /ai
        const isAICommand = message && message.trim().toLowerCase().startsWith('/ai ');

        if (isAICommand) {
            console.log('🤖 AI command detected in regular chat');

            // Extract the question after /ai
            const aiQuestion = message.trim().substring(4).trim(); // Remove '/ai ' prefix

            if (aiQuestion) {
                try {
                    // Get recent messages for context (last 10 messages)
                    const recentMessages = await messagesCollection
                        .find({ roomId: roomId })
                        .sort({ timestamp: -1 })
                        .limit(10)
                        .toArray();

                    // Build conversation history
                    const conversationHistory = recentMessages.reverse().map(msg => ({
                        role: msg.senderId === currentUserId ? 'user' : 'assistant',
                        content: msg.message
                    }));

                    // Call AI API
                    const aiResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/ai/chat`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Cookie': request.headers.get('cookie') || ''
                        },
                        body: JSON.stringify({
                            message: aiQuestion,
                            conversationHistory: conversationHistory
                        })
                    });

                    const aiResult = await aiResponse.json();

                    if (aiResult.success) {
                        // Create AI response message
                        const aiMessageCount = await messagesCollection.countDocuments();
                        const aiMessageId = `msg${String(aiMessageCount + 1).padStart(6, '0')}`;

                        // Clean AI response: remove markdown formatting and robot emojis
                        let cleanResponse = aiResult.data.response
                            .replace(/\*\*/g, '') // Remove bold markdown
                            .replace(/\*/g, '')   // Remove italic markdown
                            .replace(/`/g, '')    // Remove code markdown
                            .replace(/#{1,6}\s/g, '') // Remove heading markdown
                            .replace(/🤖/g, '')   // Remove robot emoji to prevent duplication
                            .replace(/\s+/g, ' ') // Normalize whitespace
                            .trim();

                        const aiMessage = {
                            _id: aiMessageId,
                            roomId: roomId,
                            senderId: 'ai-assistant',
                            message: cleanResponse, // No prefix needed, badge will show it's AI
                            messageType: 'text',
                            timestamp: new Date(),
                            isEdited: false,
                            isDeleted: false
                        };

                        await messagesCollection.insertOne(aiMessage);

                        // Update room last message
                        await roomsCollection.updateOne(
                            { _id: roomId },
                            {
                                $set: {
                                    lastMessage: `${aiResult.data.response.substring(0, 50)}...`,
                                    lastActivity: new Date()
                                }
                            }
                        );

                        console.log('✅ AI response saved:', aiMessageId);
                    } else {
                        console.error('❌ AI API error:', aiResult.message);
                    }
                } catch (aiError) {
                    console.error('❌ Error processing AI command:', aiError);
                }
            }
        }

        return Response.json({
            success: true,
            message: "Pesan berhasil dikirim!",
            data: {
                messageId: messageId,
                timestamp: newMessage.timestamp,
                isDeleted: newMessage.isDeleted || false,
                isAICommand: isAICommand // Flag to indicate AI command was processed
            }
        }, { status: 201 });

    } catch (error) {
        console.error("❌ ERROR SAVE MESSAGE:", error);
        return Response.json({
            success: false,
            message: "Error waktu simpan pesan",
            error: error.message
        }, { status: 500 });
    }
}

export async function PATCH(request) {
    try {
        // Ambil data dari URL dan body
        const url = new URL(request.url);
        const messageId = url.searchParams.get('messageId');
        const { text, isEdited } = await request.json();

        console.log("🔄 Updating message:", { messageId, text });

        // Check authentication
        const { session, userId, error } = await getAuthSessionOrApiKey(request);

        if (error) {
            console.error("❌ Auth error:", error);
            return error;
        }

        const currentUserId = userId;

        if (!messageId) {
            console.error("❌ Message ID is missing");
            return Response.json({
                success: false,
                message: "Message ID harus diisi"
            }, { status: 400 });
        }

        if (!text) {
            console.error("❌ Message text is missing");
            return Response.json({
                success: false,
                message: "Text pesan harus diisi"
            }, { status: 400 });
        }

        // Sambung ke database
        await connectToDatabase();
        const db = mongoose.connection.db;
        const messagesCollection = db.collection("messages");
        const roomsCollection = db.collection("rooms");

        // Cek apakah pesan ada dan user adalah pengirim
        const message = await messagesCollection.findOne({ _id: messageId });

        if (!message) {
            console.error("❌ Message not found in database:", messageId);
            return Response.json({
                success: false,
                message: `Pesan dengan ID ${messageId} tidak ditemukan`
            }, { status: 404 });
        }

        // Hanya pengirim yang bisa edit pesan
        if (message.senderId !== currentUserId) {
            console.error("❌ Unauthorized edit attempt:", { messageSenderId: message.senderId, currentUserId });
            return Response.json({
                success: false,
                message: "Hanya pengirim yang bisa edit pesan ini"
            }, { status: 403 });
        }

        // Update pesan
        const result = await messagesCollection.updateOne(
            { _id: messageId },
            {
                $set: {
                    message: text,
                    isEdited: true, // Selalu true saat edit
                    editedAt: new Date()
                }
            }
        );
        console.log("📝 Update result:", result);

        if (result.matchedCount === 0) {
            console.error("❌ Failed to update message:", messageId);
            return Response.json({
                success: false,
                message: "Gagal edit pesan"
            }, { status: 500 });
        }

        // Update last activity di room
        await roomsCollection.updateOne(
            { _id: message.roomId },
            {
                $set: {
                    lastActivity: new Date()
                }
            }
        );

        console.log("✅ Message updated successfully:", messageId);

        return Response.json({
            success: true,
            message: "Pesan berhasil diupdate!",
            data: {
                messageId: messageId,
                isEdited: true
            }
        }, { status: 200 });

    } catch (error) {
        console.error("❌ ERROR UPDATE MESSAGE:", error);
        return Response.json({
            success: false,
            message: "Error waktu update pesan",
            error: error.message
        }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        // 1. Ambil data dari URL (kita akan menggunakan query parameter untuk messageId)
        const url = new URL(request.url);
        const messageId = url.searchParams.get('messageId');

        console.log("🔄 Deleting message:", { messageId, url: request.url });

        // 2. Check authentication
        const { session, userId, error } = await getAuthSessionOrApiKey(request);

        if (error) {
            console.error("❌ Auth error:", error);
            return error;
        }

        const currentUserId = userId;

        if (!messageId) {
            console.error("❌ Message ID is missing");
            return Response.json({
                success: false,
                message: "Message ID harus diisi"
            }, { status: 400 });
        }

        // 3. Sambung ke database
        await connectToDatabase();
        const db = mongoose.connection.db;
        const messagesCollection = db.collection("messages");
        const roomsCollection = db.collection("rooms");

        // 4. Cek apakah pesan ada dan user adalah pengirim
        const message = await messagesCollection.findOne({ _id: messageId });
        console.log("🔍 Found message:", { messageExists: !!message, messageId, currentUserId });

        if (!message) {
            console.error("❌ Message not found in database:", messageId);
            return Response.json({
                success: false,
                message: `Pesan dengan ID ${messageId} tidak ditemukan`
            }, { status: 404 });
        }

        // 5. Hanya pengirim yang bisa hapus pesan
        if (message.senderId !== currentUserId) {
            console.error("❌ Unauthorized delete attempt:", { messageSenderId: message.senderId, currentUserId });
            return Response.json({
                success: false,
                message: "Hanya pengirim yang bisa hapus pesan ini"
            }, { status: 403 });
        }

        // 6. Cek apakah pesan sudah dihapus sebelumnya
        if (message.isDeleted) {
            console.log("⚠️ Message already deleted:", messageId);
            return Response.json({
                success: true,
                message: "Pesan sudah dihapus sebelumnya",
                data: {
                    messageId: messageId
                }
            }, { status: 200 }); // Kembalikan sukses agar UI bisa diperbarui
        }

        // 7. Update pesan jadi isDeleted: true
        const result = await messagesCollection.updateOne(
            { _id: messageId },
            {
                $set: {
                    isDeleted: true,
                    deletedAt: new Date(),
                    editedAt: new Date() // Using editedAt field to track deletion time too
                }
            }
        );
        console.log("📝 Update result:", result);

        if (result.matchedCount === 0) {
            console.error("❌ Failed to update message:", messageId);
            return Response.json({
                success: false,
                message: "Gagal hapus pesan"
            }, { status: 500 });
        }

        console.log("✅ Message deleted successfully:", messageId);

        // 7. Update last activity di room
        await roomsCollection.updateOne(
            { _id: message.roomId },
            {
                $set: {
                    lastActivity: new Date()
                }
            }
        );

        return Response.json({
            success: true,
            message: "Pesan berhasil dihapus!",
            data: {
                messageId: messageId
            }
        }, { status: 200 });

    } catch (error) {
        console.error("❌ ERROR DELETE MESSAGE:", error);
        return Response.json({
            success: false,
            message: "Error waktu hapus pesan",
            error: error.message
        }, { status: 500 });
    }
}
