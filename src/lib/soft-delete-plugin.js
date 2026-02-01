/**
 * Mongoose Plugin untuk Soft Delete Functionality
 * Menambahkan field isDeleted, deletedAt, deletedBy dan methods untuk soft delete
 */

function softDeletePlugin(schema, options = {}) {
    // Add soft delete fields to schema
    schema.add({
        isActive: {
            type: Boolean,
            default: true,
            index: true, // Index untuk performance query
        },
        isDeleted: {
            type: Boolean,
            default: false,
            index: true, // Index untuk performance query
        },
        deletedAt: {
            type: Date,
            default: null,
        },
        deletedBy: {
            type: String,
            ref: "User",
            default: null,
        },
    });

    // Static method: Delete by ID (soft delete)
    schema.statics.softDeleteById = async function (id, deletedBy = null) {
        return this.findByIdAndUpdate(
            id,
            {
                $set: {
                    isDeleted: true,
                    deletedAt: new Date(),
                    deletedBy: deletedBy,
                },
            },
            { new: true }
        );
    };

    // Static method: Soft delete dengan kondisi custom
    schema.statics.softDelete = async function (filter, deletedBy = null) {
        return this.updateMany(filter, {
            $set: {
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy: deletedBy,
            },
        });
    };

    // Instance method: Soft delete single document
    schema.methods.softDelete = async function (deletedBy = null) {
        this.isDeleted = true;
        this.deletedAt = new Date();
        this.deletedBy = deletedBy;
        return this.save();
    };

    // Static method: Restore soft deleted document
    schema.statics.restore = async function (filter) {
        return this.updateMany(filter, {
            $set: {
                isDeleted: false,
                deletedAt: null,
                deletedBy: null,
            },
        });
    };

    // Instance method: Restore single document
    schema.methods.restore = async function () {
        this.isDeleted = false;
        this.deletedAt = null;
        this.deletedBy = null;
        return this.save();
    };

    // Static method: Find active (non-deleted) documents
    schema.statics.findActive = function (filter = {}) {
        return this.find({ ...filter, isDeleted: { $ne: true } });
    };

    // Static method: Find one active document
    schema.statics.findOneActive = function (filter = {}) {
        return this.findOne({ ...filter, isDeleted: { $ne: true } });
    };

    // Static method: Count active documents
    schema.statics.countActive = function (filter = {}) {
        return this.countDocuments({ ...filter, isDeleted: { $ne: true } });
    };

    // ====== IsActive Methods ======

    // Static method: Activate by ID
    schema.statics.activateById = async function (id) {
        return this.findByIdAndUpdate(
            id,
            { $set: { isActive: true } },
            { new: true }
        );
    };

    // Static method: Deactivate by ID
    schema.statics.deactivateById = async function (id) {
        return this.findByIdAndUpdate(
            id,
            { $set: { isActive: false } },
            { new: true }
        );
    };

    // Instance method: Activate single document
    schema.methods.activate = async function () {
        this.isActive = true;
        return this.save();
    };

    // Instance method: Deactivate single document
    schema.methods.deactivate = async function () {
        this.isActive = false;
        return this.save();
    };

    // Static method: Find active AND enabled documents (isActive: true AND isDeleted: false)
    schema.statics.findActiveAndEnabled = function (filter = {}) {
        return this.find({ ...filter, isActive: true, isDeleted: { $ne: true } });
    };

    // Static method: Find one active and enabled document
    schema.statics.findOneActiveAndEnabled = function (filter = {}) {
        return this.findOne({ ...filter, isActive: true, isDeleted: { $ne: true } });
    };

    // Override default find methods untuk auto-exclude soft deleted (optional)
    // Bisa diaktifkan dengan option autoExcludeDeleted: true
    if (options.autoExcludeDeleted) {
        // Override find
        const originalFind = schema.statics.find;
        schema.statics.find = function (filter = {}, ...args) {
            if (!filter.isDeleted) {
                filter.isDeleted = { $ne: true };
            }
            return originalFind.call(this, filter, ...args);
        };

        // Override findOne
        const originalFindOne = schema.statics.findOne;
        schema.statics.findOne = function (filter = {}, ...args) {
            if (!filter.isDeleted) {
                filter.isDeleted = { $ne: true };
            }
            return originalFindOne.call(this, filter, ...args);
        };

        // Override countDocuments
        const originalCount = schema.statics.countDocuments;
        schema.statics.countDocuments = function (filter = {}, ...args) {
            if (!filter.isDeleted) {
                filter.isDeleted = { $ne: true };
            }
            return originalCount.call(this, filter, ...args);
        };
    }

    // Add indexes untuk soft delete and isActive queries
    schema.index({ isDeleted: 1, deletedAt: 1 });
    schema.index({ isActive: 1, isDeleted: 1 }); // Compound index for active + not deleted
}

export default softDeletePlugin;
