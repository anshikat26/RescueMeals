const mongoose = require("mongoose");

const WebsiteContentSchema = new mongoose.Schema({
    page: {
        type: String,
        required: true,
        enum: ['home', 'about', 'contact', 'footer', 'privacy', 'terms']
    },
    section: {
        type: String,
        required: true
    },
    content: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

// Compound index for page + section to ensure uniqueness
WebsiteContentSchema.index({ page: 1, section: 1 }, { unique: true });

module.exports = mongoose.model("WebsiteContent", WebsiteContentSchema);
