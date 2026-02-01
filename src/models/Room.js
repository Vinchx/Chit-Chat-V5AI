import mongoose from "mongoose";
import softDeletePlugin from "@/lib/soft-delete-plugin";

const RoomSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ["private", "group", "ai"],
        required: true,
    },
    members: [{
        type: String,
        ref: "User",
    }],
    createdBy: {
        type: String,
        required: true,
        ref: "User",
    },
    // Khusus Group Room
    admins: [{
        type: String,
        ref: "User",
    }],
    description: {
        type: String,
        default: "",
    },
    groupAvatar: {
        type: String,
        default: null,
    },
    settings: {
        onlyAdminsCanPost: {
            type: Boolean,
            default: false,
        },
        onlyAdminsCanAddMembers: {
            type: Boolean,
            default: true,
        },
        onlyAdminsCanEditInfo: {
            type: Boolean,
            default: true,
        },
    },
    // Metadata
    lastMessage: {
        type: String,
        default: null,
    },
    lastActivity: {
        type: Date,
        default: Date.now,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Indexes for query performance
RoomSchema.index({ type: 1 }); // Filter by room type (private/group/ai)
RoomSchema.index({ members: 1 }); // Check user membership, find user's rooms
RoomSchema.index({ lastActivity: -1 }); // Sort rooms by recent activity
RoomSchema.index({ createdBy: 1 }); // Find rooms created by user

// Apply soft delete plugin
RoomSchema.plugin(softDeletePlugin);

// Prevent model overwrite upon initial compilation
export default mongoose.models.Room || mongoose.model("Room", RoomSchema);
