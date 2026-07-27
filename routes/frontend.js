const express = require("express");
const router = express.Router();
const WebsiteContent = require("../models/WebsiteContent");
const WebsiteSettings = require("../models/WebsiteSettings");
const Gallery = require("../models/Gallery");
const FAQ = require("../models/FAQ");
const Testimonial = require("../models/Testimonial");

// Get all data needed for the frontend home page
router.get("/data", async (req, res) => {
    try {
        // Fetch website settings
        let settings = await WebsiteSettings.findOne();
        if (!settings) {
            settings = new WebsiteSettings();
            await settings.save();
        }

        // Fetch all website content
        const allContent = await WebsiteContent.find({});

        // Organize content by page and section
        const contentMap = {};
        allContent.forEach(item => {
            if (!contentMap[item.page]) {
                contentMap[item.page] = {};
            }
            contentMap[item.page][item.section] = item.content;
        });

        // Fetch gallery images
        const gallery = await Gallery.find().sort({ order: 1 });

        // Fetch active FAQs
        const faqs = await FAQ.find({ is_active: true }).sort({ order: 1 });

        // Fetch active testimonials
        const testimonials = await Testimonial.find({ is_active: true }).sort({ order: 1 });

        res.json({
            settings,
            content: contentMap,
            gallery,
            faqs,
            testimonials
        });
    } catch (error) {
        console.error("Error fetching frontend data:", error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
