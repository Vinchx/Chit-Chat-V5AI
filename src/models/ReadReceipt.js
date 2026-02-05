import mongoose from "mongoose";

const ReadReceiptSchema = new mongoose.Schema({
    messageId: {
        type: String,
        required: true,
        ref: "Message",
    },
    userId: {
        type: String,
        required: true,
        ref: "User",
    },
    roomId: {
        type: String,
        required: true,
        ref: "Room",
    },
    readAt: {
        type: Date,
        default: Date.now,
    },
});

// Compound index untuk ensure setiap user hanya punya 1 read receipt per message
ReadReceiptSchema.index({ messageId: 1, userId: 1 }, { unique: true });

// Index untuk query performa - ambil semua read receipts di room tertentu
ReadReceiptSchema.index({ roomId: 1, userId: 1, readAt: -1 });

// Index untuk query read receipts by message
ReadReceiptSchema.index({ messageId: 1, readAt: 1 });

// Prevent model overwrite upon initial compilation
export default mongoose.models.ReadReceipt || mongoose.model("ReadReceipt", ReadReceiptSchema);
