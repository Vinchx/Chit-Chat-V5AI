import mongoose from "mongoose";
import softDeletePlugin from "@/lib/soft-delete-plugin";

const BlockedUserSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
    },
    blockerId: {
        type: String,
        required: true,
        ref: "User",
    },
    blockedUserId: {
        type: String,
        required: true,
        ref: "User",
    },
    type: {
        type: String,
        enum: ["block", "mute"],
        default: "block",
    },
    blockedAt: {
        type: Date,
        default: Date.now,
    },
});

// Compound unique index: prevent duplicate blocks
BlockedUserSchema.index({ blockerId: 1, blockedUserId: 1 }, { unique: true });

// Index untuk query siapa yang nge-block user ini
BlockedUserSchema.index({ blockedUserId: 1 });

// Index untuk query list blocked users by blocker
BlockedUserSchema.index({ blockerId: 1, blockedAt: -1 });

// Apply soft delete plugin
BlockedUserSchema.plugin(softDeletePlugin);

// Prevent model overwrite upon initial compilation
export default mongoose.models.BlockedUser ||
    mongoose.model("BlockedUser", BlockedUserSchema);
