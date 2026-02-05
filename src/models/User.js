import mongoose from "mongoose";
import softDeletePlugin from "@/lib/soft-delete-plugin";

const UserSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  displayName: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    default: null,
  },
  banner: {
    type: String,
    default: null,
  },
  bio: {
    type: String,
    default: '',
  },
  isOnline: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: {
    type: String,
    default: null,
  },
  verifiedAt: {
    type: Date,
    default: null,
  },
  verificationOtp: {
    type: String,
    default: null,
  },
  verificationOtpExpires: {
    type: Date,
    default: null,
  },
  resetPasswordOtp: {
    type: String,
    default: null,
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
  },
  // Passkey credentials for WebAuthn
  passkeys: [{
    credentialID: {
      type: String, // Changed from Buffer to String (base64url) to avoid encoding issues
      required: true,
    },
    publicKey: {
      type: String, // Changed from Buffer to String (base64) to avoid encoding issues
      required: true,
    },
    counter: {
      type: Number,
      required: true,
    },
    deviceType: {
      type: String,
      default: 'unknown',
    },
    backedUp: {
      type: Boolean,
      default: false,
    },
    transports: {
      type: [String],
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  // User moderation fields
  isBanned: {
    type: Boolean,
    default: false,
  },
  bannedAt: {
    type: Date,
    default: null,
  },
  bannedReason: {
    type: String,
    default: null,
  },
  suspendedUntil: {
    type: Date,
    default: null,
  },
  suspensionReason: {
    type: String,
    default: null,
  },
  warningCount: {
    type: Number,
    default: 0,
  },
});

// Apply soft delete plugin
UserSchema.plugin(softDeletePlugin);

// Prevent model overwrite upon initial compilation
export default mongoose.models.User || mongoose.model("User", UserSchema);
