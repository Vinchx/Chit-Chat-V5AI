import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
    },
    reporterId: {
        type: String,
        required: true,
        ref: "User",
    },
    reportedUserId: {
        type: String,
        required: true,
        ref: "User",
    },
    category: {
        type: String,
        enum: ["harassment", "spam", "inappropriate_content", "impersonation", "other"],
        required: true,
    },
    reason: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "under_review", "resolved", "rejected"],
        default: "pending",
    },
    evidence: {
        type: [String],
        default: [],
    },
    reviewedBy: {
        type: String,
        ref: "User",
        default: null,
    },
    reviewNote: {
        type: String,
        default: null,
    },
    actionTaken: {
        type: String,
        enum: ["none", "warning", "suspend", "ban"],
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    reviewedAt: {
        type: Date,
        default: null,
    },
});

// Indexes for efficient queries
ReportSchema.index({ reporterId: 1, createdAt: -1 });
ReportSchema.index({ reportedUserId: 1, createdAt: -1 });
ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ createdAt: -1 });

// Compound index to prevent spam reports from same user to same target
ReportSchema.index({ reporterId: 1, reportedUserId: 1, status: 1 });

// Prevent model overwrite upon initial compilation
export default mongoose.models.Report || mongoose.model("Report", ReportSchema);
