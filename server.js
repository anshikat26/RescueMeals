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

const app = express();
initializePassport(passport);


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


// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("✅ MongoDB Connected"))
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

        // Make data available to all views
        res.locals.settings = settings;
        res.locals.content = contentMap;

        next();
    } catch (error) {
        console.error("Error in data middleware:", error);
        res.locals.settings = {};
        res.locals.content = {};
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