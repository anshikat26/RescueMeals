const express = require("express");
const router = express.Router();
const ContactMessage = require("../models/ContactMessage");

// ==========================
// CONTACT FORM SUBMISSION
// ==========================

router.post("/contact", async (req, res) => {
    try {
        const { name, email, subject, message, phone } = req.body;
        
        // Validate required fields
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ 
                success: false, 
                message: "All required fields must be filled" 
            });
        }
        
        // Create new contact message
        const contactMessage = new ContactMessage({
            name,
            email,
            phone: phone || "",
            subject,
            message
        });
        
        await contactMessage.save();
        
        res.json({ 
            success: true, 
            message: "Message sent successfully! We'll get back to you soon." 
        });
    } catch (error) {
        console.error("Contact form error:", error);
        res.status(500).json({ 
            success: false, 
            message: "An error occurred. Please try again." 
        });
    }
});

module.exports = router;
