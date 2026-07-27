const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const WebsiteContent = require("../models/WebsiteContent");
const WebsiteSettings = require("../models/WebsiteSettings");
const Gallery = require("../models/Gallery");
const FAQ = require("../models/FAQ");
const Testimonial = require("../models/Testimonial");
const ContactMessage = require("../models/ContactMessage");
const checkRole = require("../middleware/roleMiddleware");

// ==========================
// IMAGE UPLOAD (Admin only)
// ==========================

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/uploads");
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, "cms-" + Date.now() + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: function (req, file, cb) {
        if (/^image\//.test(file.mimetype)) {
            return cb(null, true);
        }
        cb(new Error("Only image files are allowed"));
    }
});

// Upload/replace an image and get back its public URL
router.post("/upload", checkRole(["Admin"]), upload.single("image"), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        res.json({ url: "/uploads/" + req.file.filename });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==========================
// WEBSITE CONTENT APIs
// ==========================

// Get content for a specific page and section
router.get("/content/:page/:section", async (req, res) => {
    try {
        const { page, section } = req.params;
        const content = await WebsiteContent.findOne({ page, section });
        
        if (!content) {
            return res.status(404).json({ message: "Content not found" });
        }
        
        res.json(content);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all content for a page
router.get("/content/:page", async (req, res) => {
    try {
        const { page } = req.params;
        const contents = await WebsiteContent.find({ page });
        res.json(contents);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update or create content (Admin only)
router.put("/content/:page/:section", checkRole(["Admin"]), async (req, res) => {
    try {
        const { page, section } = req.params;
        const content = req.body;
        
        const updatedContent = await WebsiteContent.findOneAndUpdate(
            { page, section },
            { 
                content,
                updated_at: Date.now()
            },
            { upsert: true, new: true }
        );
        
        res.json(updatedContent);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==========================
// WEBSITE SETTINGS APIs
// ==========================

// Get website settings
router.get("/settings", async (req, res) => {
    try {
        let settings = await WebsiteSettings.findOne();
        
        if (!settings) {
            settings = new WebsiteSettings();
            await settings.save();
        }
        
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update website settings (Admin only)
router.put("/settings", checkRole(["Admin"]), async (req, res) => {
    try {
        let settings = await WebsiteSettings.findOne();
        
        if (!settings) {
            settings = new WebsiteSettings();
        }
        
        Object.assign(settings, req.body);
        settings.updated_at = Date.now();
        await settings.save();
        
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==========================
// GALLERY APIs
// ==========================

// Get all gallery images
router.get("/gallery", async (req, res) => {
    try {
        const images = await Gallery.find().sort({ order: 1 });
        res.json(images);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add gallery image (Admin only)
router.post("/gallery", checkRole(["Admin"]), async (req, res) => {
    try {
        const image = new Gallery(req.body);
        await image.save();
        res.status(201).json(image);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Reorder gallery images (Admin only) — must be before "/gallery/:id"
router.put("/gallery/reorder", checkRole(["Admin"]), async (req, res) => {
    try {
        const { items } = req.body;

        for (const item of items) {
            await Gallery.findByIdAndUpdate(item.id, { order: item.order });
        }

        res.json({ message: "Gallery reordered successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update gallery image (Admin only)
router.put("/gallery/:id", checkRole(["Admin"]), async (req, res) => {
    try {
        const image = await Gallery.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updated_at: Date.now() },
            { new: true }
        );
        
        if (!image) {
            return res.status(404).json({ message: "Image not found" });
        }
        
        res.json(image);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete gallery image (Admin only)
router.delete("/gallery/:id", checkRole(["Admin"]), async (req, res) => {
    try {
        const image = await Gallery.findByIdAndDelete(req.params.id);
        
        if (!image) {
            return res.status(404).json({ message: "Image not found" });
        }
        
        res.json({ message: "Image deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==========================
// FAQ APIs
// ==========================

// Get all FAQs (use ?all=true in the admin panel to include inactive ones)
router.get("/faq", async (req, res) => {
    try {
        const filter = req.query.all === "true" ? {} : { is_active: true };
        const faqs = await FAQ.find(filter).sort({ order: 1 });
        res.json(faqs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add FAQ (Admin only)
router.post("/faq", checkRole(["Admin"]), async (req, res) => {
    try {
        const faq = new FAQ(req.body);
        await faq.save();
        res.status(201).json(faq);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Reorder FAQs (Admin only) — must be before "/faq/:id"
router.put("/faq/reorder", checkRole(["Admin"]), async (req, res) => {
    try {
        const { items } = req.body;

        for (const item of items) {
            await FAQ.findByIdAndUpdate(item.id, { order: item.order });
        }

        res.json({ message: "FAQs reordered successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update FAQ (Admin only)
router.put("/faq/:id", checkRole(["Admin"]), async (req, res) => {
    try {
        const faq = await FAQ.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updated_at: Date.now() },
            { new: true }
        );
        
        if (!faq) {
            return res.status(404).json({ message: "FAQ not found" });
        }
        
        res.json(faq);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete FAQ (Admin only)
router.delete("/faq/:id", checkRole(["Admin"]), async (req, res) => {
    try {
        const faq = await FAQ.findByIdAndDelete(req.params.id);
        
        if (!faq) {
            return res.status(404).json({ message: "FAQ not found" });
        }
        
        res.json({ message: "FAQ deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==========================
// TESTIMONIALS APIs
// ==========================

// Get all testimonials (use ?all=true in the admin panel to include inactive ones)
router.get("/testimonials", async (req, res) => {
    try {
        const filter = req.query.all === "true" ? {} : { is_active: true };
        const testimonials = await Testimonial.find(filter).sort({ order: 1 });
        res.json(testimonials);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add testimonial (Admin only)
router.post("/testimonials", checkRole(["Admin"]), async (req, res) => {
    try {
        const testimonial = new Testimonial(req.body);
        await testimonial.save();
        res.status(201).json(testimonial);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update testimonial (Admin only)
router.put("/testimonials/:id", checkRole(["Admin"]), async (req, res) => {
    try {
        const testimonial = await Testimonial.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updated_at: Date.now() },
            { new: true }
        );
        
        if (!testimonial) {
            return res.status(404).json({ message: "Testimonial not found" });
        }
        
        res.json(testimonial);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete testimonial (Admin only)
router.delete("/testimonials/:id", checkRole(["Admin"]), async (req, res) => {
    try {
        const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
        
        if (!testimonial) {
            return res.status(404).json({ message: "Testimonial not found" });
        }
        
        res.json({ message: "Testimonial deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==========================
// CONTACT MESSAGES APIs
// ==========================

// Get all contact messages (Admin only)
router.get("/contact-messages", checkRole(["Admin"]), async (req, res) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;
        
        let query = {};
        
        if (search) {
            query = {
                $or: [
                    { name: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } },
                    { subject: { $regex: search, $options: "i" } }
                ]
            };
        }
        
        const messages = await ContactMessage.find(query)
            .sort({ created_at: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));
        
        const total = await ContactMessage.countDocuments(query);
        
        res.json({
            messages,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Mark message as read (Admin only)
router.put("/contact-messages/:id/read", checkRole(["Admin"]), async (req, res) => {
    try {
        const message = await ContactMessage.findByIdAndUpdate(
            req.params.id,
            { is_read: true },
            { new: true }
        );
        
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }
        
        res.json(message);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete contact message (Admin only)
router.delete("/contact-messages/:id", checkRole(["Admin"]), async (req, res) => {
    try {
        const message = await ContactMessage.findByIdAndDelete(req.params.id);
        
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }
        
        res.json({ message: "Message deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Export contact messages to CSV (Admin only)
router.get("/contact-messages/export", checkRole(["Admin"]), async (req, res) => {
    try {
        const messages = await ContactMessage.find().sort({ created_at: -1 });
        
        const csv = [
            ['Name', 'Email', 'Phone', 'Subject', 'Message', 'Date'],
            ...messages.map(msg => [
                msg.name,
                msg.email,
                msg.phone || '',
                msg.subject,
                msg.message,
                msg.created_at.toISOString()
            ])
        ].map(row => row.join(',')).join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=contact_messages.csv');
        res.send(csv);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
