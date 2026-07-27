const mongoose = require("mongoose");

const WebsiteSettingsSchema = new mongoose.Schema({
    website_name: {
        type: String,
        default: "RescueMeals"
    },
    logo_url: {
        type: String,
        default: ""
    },
    favicon_url: {
        type: String,
        default: ""
    },
    primary_color: {
        type: String,
        default: "#16A34A"
    },
    secondary_color: {
        type: String,
        default: "#22C55E"
    },
    seo_title: {
        type: String,
        default: "RescueMeals - Reduce Food Waste, Feed Lives"
    },
    seo_description: {
        type: String,
        default: "Connecting food donors with NGOs and volunteers to reduce food wastage and support communities in need."
    },
    meta_keywords: {
        type: [String],
        default: ["food donation", "food waste", "NGO", "charity", "volunteer"]
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("WebsiteSettings", WebsiteSettingsSchema);
