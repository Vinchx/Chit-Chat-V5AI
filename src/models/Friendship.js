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

// Indexes for query performance and data integrity
FriendshipSchema.index({ senderId: 1, receiverId: 1 }, { unique: true }); // Prevent duplicate friendships
FriendshipSchema.index({ receiverId: 1, status: 1 }); // Query incoming friend requests
FriendshipSchema.index({ senderId: 1, status: 1 }); // Query sent friend requests

// Prevent model overwrite upon initial compilation
export default mongoose.models.Friendship || mongoose.model("Friendship", FriendshipSchema);
