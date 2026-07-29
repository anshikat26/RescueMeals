const express = require("express");
const bcrypt = require("bcryptjs");
const passport = require("passport");

const router = express.Router();

const User = require("../models/User");

// Helper function for role-based redirection
function handleRoleRedirection(req, res) {
    if (!req.user || !req.user.role) {
        return res.redirect("/");
    }
    const role = req.user.role.trim();

    if (role === "Restaurant" || role === "Institution") {
        return res.redirect("/donor-dashboard");
    }
    if (role === "NGO") {
        return res.redirect("/ngo-dashboard");
    }
    if (role === "Volunteer") {
        return res.redirect("/volunteer-dashboard");
    }
    if (role === "Admin") {
        return res.redirect("/admin/cms/home");
    }

    res.redirect("/");
}

// Helper: check if OAuth credentials are configured
function isGoogleConfigured() {
    const id = process.env.GOOGLE_CLIENT_ID;
    return id && id.trim() !== "" && id !== "MOCK_GOOGLE_CLIENT_ID";
}

function isFacebookConfigured() {
    const id = process.env.FACEBOOK_APP_ID;
    return id && id.trim() !== "" && id !== "MOCK_FACEBOOK_APP_ID";
}


// ==========================
// SIGNUP PAGE
// ==========================

router.get("/signup", (req, res) => {
    res.render("signup");
});


// ==========================
// SIGNUP LOGIC
// ==========================

router.post("/signup", async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            institution,
            role
        } = req.body;

        // Prevent public users from creating Admin accounts
        const allowedRoles = ["Restaurant", "Institution", "NGO", "Volunteer"];
        const sanitizedRole = allowedRoles.includes(role) ? role : "Volunteer";

        // CHECK EXISTING EMAIL
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.send("Email already registered");
        }

        // HASH PASSWORD
        const hashedPassword = await bcrypt.hash(password, 10);

        // CREATE USER
        const user = new User({
            name,
            email,
            password: hashedPassword,
            institution: institution || "Individual",
            role: sanitizedRole
        });

        await user.save();

        res.redirect("/login");
    } catch (error) {
        console.log(error);
        res.send(error.message);
    }
});


// ==========================
// LOGIN PAGE
// ==========================

router.get("/login", (req, res) => {
    res.render("login");
});


// ==========================
// LOGIN LOGIC (LOCAL)
// ==========================

router.post(
    "/login",
    passport.authenticate("local", {
        failureRedirect: "/login"
    }),
    (req, res) => {
        handleRoleRedirection(req, res);
    }
);


// ==========================
// GOOGLE AUTH ROUTES
// ==========================

router.get("/auth/google", (req, res, next) => {
    if (!isGoogleConfigured()) {
        return res.status(503).send(`
            <html>
            <head><title>Google Login Not Available</title>
            <style>
                body { font-family: 'Poppins', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f8fafc; margin: 0; }
                .error-box { background: white; border-radius: 16px; padding: 40px; max-width: 480px; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.1); }
                .error-box h2 { color: #dc2626; margin-bottom: 12px; }
                .error-box p { color: #64748b; line-height: 1.6; }
                .error-box a { display: inline-block; margin-top: 20px; padding: 10px 24px; background: #16a34a; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; }
                .error-box a:hover { background: #15803d; }
            </style>
            </head>
            <body>
                <div class="error-box">
                    <h2><i class="fab fa-google"></i> Google Login Not Configured</h2>
                    <p>Google OAuth credentials have not been set up yet. Please add your <strong>GOOGLE_CLIENT_ID</strong> and <strong>GOOGLE_CLIENT_SECRET</strong> to the <code>.env</code> file.</p>
                    <a href="/login">&larr; Back to Login</a>
                </div>
            </body>
            </html>
        `);
    }
    passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
});

router.get("/auth/google/callback", (req, res, next) => {
    if (!isGoogleConfigured()) {
        return res.redirect("/login");
    }
    passport.authenticate("google", { failureRedirect: "/login?auth=error" })(req, res, (err) => {
        if (err) return next(err);
        handleRoleRedirection(req, res);
    });
});


// ==========================
// FACEBOOK AUTH ROUTES
// ==========================

router.get("/auth/facebook", (req, res, next) => {
    if (!isFacebookConfigured()) {
        return res.status(503).send(`
            <html>
            <head><title>Facebook Login Not Available</title>
            <style>
                body { font-family: 'Poppins', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f8fafc; margin: 0; }
                .error-box { background: white; border-radius: 16px; padding: 40px; max-width: 480px; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.1); }
                .error-box h2 { color: #1877f2; margin-bottom: 12px; }
                .error-box p { color: #64748b; line-height: 1.6; }
                .error-box a { display: inline-block; margin-top: 20px; padding: 10px 24px; background: #16a34a; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; }
                .error-box a:hover { background: #15803d; }
            </style>
            </head>
            <body>
                <div class="error-box">
                    <h2><i class="fab fa-facebook"></i> Facebook Login Not Configured</h2>
                    <p>Facebook OAuth credentials have not been set up yet. Please add your <strong>FACEBOOK_APP_ID</strong> and <strong>FACEBOOK_APP_SECRET</strong> to the <code>.env</code> file.</p>
                    <a href="/login">&larr; Back to Login</a>
                </div>
            </body>
            </html>
        `);
    }
    passport.authenticate("facebook", { scope: ["email"] })(req, res, next);
});

router.get("/auth/facebook/callback", (req, res, next) => {
    if (!isFacebookConfigured()) {
        return res.redirect("/login");
    }
    passport.authenticate("facebook", { failureRedirect: "/login?auth=error" })(req, res, (err) => {
        if (err) return next(err);
        handleRoleRedirection(req, res);
    });
});


// ==========================
// DASHBOARD ROUTER
// ==========================

router.get("/dashboard", (req, res) => {
    handleRoleRedirection(req, res);
});


// ==========================
// LOGOUT
// ==========================

router.get("/logout", (req, res, next) => {
    req.logout(function(err) {
        if (err) {
            return next(err);
        }
        res.redirect("/login");
    });
});


module.exports = router;