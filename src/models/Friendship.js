import mongoose from "mongoose";

const FriendshipSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
    },
    senderId: {
        type: String,
        required: true,
        ref: "User",
    },
    receiverId: {
        type: String,
        required: true,
        ref: "User",
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Prevent model overwrite upon initial compilation
export default mongoose.models.Friendship || mongoose.model("Friendship", FriendshipSchema);
