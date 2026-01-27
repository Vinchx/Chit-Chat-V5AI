import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
    },
    roomId: {
        type: String,
        required: true,
        ref: "Room",
    },
    senderId: {
        type: String,
        required: true,
        ref: "User", // Bisa 'ai-assistant' juga, makanya tipe String fleksibel
    },
    message: {
        type: String,
        default: "",
    },
    messageType: {
        type: String,
        enum: ["text", "image", "file", "sticker"],
        default: "text",
    },
    // Attachment jika ada (file/image)
    attachment: {
        type: {
            type: String,
            enum: ["image", "file"],
        },
        url: String,
        filename: String,
        size: Number,
        mimeType: String,
    },
    // Reply Context
    replyTo: {
        messageId: {
            type: String,
            ref: "Message",
        },
        text: String,
        sender: String,
        attachment: Object,
    },
    // Status Flags
    isEdited: {
        type: Boolean,
        default: false,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    // Timestamps
    editedAt: {
        type: Date,
    },
    deletedAt: {
        type: Date,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

// Index untuk performa query chat history
MessageSchema.index({ roomId: 1, timestamp: -1 });

// Prevent model overwrite upon initial compilation
export default mongoose.models.Message || mongoose.model("Message", MessageSchema);
