const express = require("express");
require("dotenv").config();
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const flash = require("connect-flash");
const path = require("path");
const initializePassport = require("./config/passport");
const checkRole = require("./middleware/roleMiddleware");
const donorRoutes = require("./routes/donor");
const ngoRoutes = require("./routes/ngo");
const volunteerRoutes = require("./routes/volunteer");
const contactRoutes = require("./routes/contact");
const cmsRoutes = require("./routes/cms");
const WebsiteContent = require("./models/WebsiteContent");
const WebsiteSettings = require("./models/WebsiteSettings");
const Gallery = require("./models/Gallery");
const FAQ = require("./models/FAQ");
const Testimonial = require("./models/Testimonial");
const User = require("./models/User");
const bcrypt = require("bcryptjs");

const app = express();
initializePassport(passport);


// Content Security Policy (CSP) & Header Middleware
app.use((req, res, next) => {
    res.setHeader(
        "Content-Security-Policy",
        "default-src 'self' http: https: data: blob: 'unsafe-inline' 'unsafe-eval'; connect-src 'self' http: https: ws: wss:; img-src 'self' http: https: data: blob:; font-src 'self' http: https: data:; script-src 'self' http: https: 'unsafe-inline' 'unsafe-eval'; style-src 'self' http: https: 'unsafe-inline';"
    );
    next();
});

// Chrome DevTools & Well-Known Endpoint Handler (Prevents 404 & CSP errors)
app.get("/.well-known/appspecific/com.chrome.devtools.json", (req, res) => {
    res.status(200).json({ status: "ok" });
});

app.get(/^\/\.well-known\/.*/, (req, res) => {
    res.status(200).end();
});

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");

app.use(session({
    secret: "rescumealssecret",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());


// Function to seed default Admin user if not present
async function seedAdminUser() {
    try {
        const adminEmail = "admin@rescuemeals.com";
        const existingAdmin = await User.findOne({ email: adminEmail });
        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash("MySecret123", 10);
            const newAdmin = new User({
                name: "Site Admin",
                email: adminEmail,
                password: hashedPassword,
                institution: "RescueMeals",
                role: "Admin"
            });
            await newAdmin.save();
            console.log("👑 Default Super Admin seeded: admin@rescuemeals.com");
        } else {
            console.log("🔒 Admin account verified in database.");
        }
    } catch (err) {
        console.error("Error seeding default admin:", err.message);
    }
}

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log("✅ MongoDB Connected");
        await seedAdminUser();
    })
    .catch(err => console.error(err));

// Middleware to make data available to all views
app.use(async (req, res, next) => {
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

        // Fetch gallery, faqs, and testimonials
        const gallery = await Gallery.find().sort({ order: 1 });
        const faqs = await FAQ.find({ is_active: true }).sort({ order: 1 });
        const testimonials = await Testimonial.find({ is_active: true }).sort({ order: 1 });

        // Make data available to all views
        res.locals.settings = settings;
        res.locals.content = contentMap;
        res.locals.gallery = gallery;
        res.locals.faqs = faqs;
        res.locals.testimonials = testimonials;
        res.locals.user = req.user || null;

        next();
    } catch (error) {
        console.error("Error in data middleware:", error);
        res.locals.settings = {};
        res.locals.content = {};
        res.locals.gallery = [];
        res.locals.faqs = [];
        res.locals.testimonials = [];
        res.locals.user = req.user || null;
        next();
    }
});

// Routes Import
const authRoutes = require("./routes/auth");


// Routes Use
app.use(authRoutes);
app.use(donorRoutes);
app.use(ngoRoutes);
app.use(volunteerRoutes);
app.use(contactRoutes);
app.use("/api/cms", cmsRoutes);


// Home Route
app.get("/", async (req, res) => {
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

        res.render("index", {
            settings,
            content: contentMap,
            gallery,
            faqs,
            testimonials
        });
    } catch (error) {
        console.error("Error fetching frontend data:", error);
        res.render("index", {
            settings: {},
            content: {},
            gallery: [],
            faqs: [],
            testimonials: []
        });
    }
});

// Standalone Gallery Page Route
app.get(["/gallery", "/Gallery"], async (req, res) => {
    try {
        let settings = await WebsiteSettings.findOne() || {};
        const allContent = await WebsiteContent.find({});
        const contentMap = {};
        allContent.forEach(item => {
            if (!contentMap[item.page]) contentMap[item.page] = {};
            contentMap[item.page][item.section] = item.content;
        });

        const gallery = await Gallery.find().sort({ order: 1 });
        res.render("gallery", {
            settings,
            content: contentMap,
            gallery
        });
    } catch (error) {
        console.error("Error loading gallery page:", error);
        res.render("gallery", {
            settings: {},
            content: {},
            gallery: []
        });
    }
});

// Privacy Policy Page Route
app.get("/privacy", async (req, res) => {
    try {
        let settings = await WebsiteSettings.findOne() || {};
        const allContent = await WebsiteContent.find({});
        const contentMap = {};
        allContent.forEach(item => {
            if (!contentMap[item.page]) contentMap[item.page] = {};
            contentMap[item.page][item.section] = item.content;
        });

        res.render("privacy", {
            settings,
            content: contentMap
        });
    } catch (error) {
        console.error("Error loading privacy page:", error);
        res.render("privacy", {
            settings: {},
            content: {}
        });
    }
});

// Terms & Conditions Page Route
app.get("/terms", async (req, res) => {
    try {
        let settings = await WebsiteSettings.findOne() || {};
        const allContent = await WebsiteContent.find({});
        const contentMap = {};
        allContent.forEach(item => {
            if (!contentMap[item.page]) contentMap[item.page] = {};
            contentMap[item.page][item.section] = item.content;
        });

        res.render("terms", {
            settings,
            content: contentMap
        });
    } catch (error) {
        console.error("Error loading terms page:", error);
        res.render("terms", {
            settings: {},
            content: {}
        });
    }
});

// CMS Dashboard Routes (Admin only)
app.get("/admin/cms/:page", checkRole(["Admin"]), (req, res) => {
    const { page } = req.params;
    const pageTitles = {
        home: 'Home Page CMS',
        about: 'About Page CMS',
        contact: 'Contact Page CMS',
        footer: 'Footer CMS',
        gallery: 'Gallery CMS',
        testimonials: 'Testimonials CMS',
        faq: 'FAQ CMS',
        privacy: 'Privacy Policy CMS',
        terms: 'Terms & Conditions CMS',
        settings: 'Website Settings CMS',
        messages: 'Contact Messages'
    };
    
    res.render(`admin/cms-${page}`, {
        pageTitle: pageTitles[page] || 'CMS Dashboard',
        activePage: page,
        user: req.user
    });
});


// Server
app.listen(3000, () => {
    console.log("Server running on port 3000");
});