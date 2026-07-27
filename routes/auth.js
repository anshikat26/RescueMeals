const express = require("express");
const bcrypt = require("bcryptjs");
const passport = require("passport");

const router = express.Router();

const User = require("../models/User");


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

        // CHECK EXISTING EMAIL

        const existingUser =
            await User.findOne({ email });

        if (existingUser) {

            return res.send(
                "Email already registered"
            );
        }

        // HASH PASSWORD

        const hashedPassword =
            await bcrypt.hash(password, 10);

        // CREATE USER

        const user = new User({

            name,

            email,

            password: hashedPassword,

            institution,

            role
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
// LOGIN LOGIC
// ==========================

router.post(

    "/login",

    passport.authenticate("local", {

        failureRedirect: "/login"
    }),

    (req, res) => {

        const role =
            req.user.role.trim();

        // ==========================
        // DONOR DASHBOARD
        // ==========================

        if (

            role === "Restaurant" ||

            role === "Institution"

        ) {

            return res.redirect(
                "/donor-dashboard"
            );
        }

        // ==========================
        // NGO DASHBOARD
        // ==========================

        if (role === "NGO") {

            return res.redirect(
                "/ngo-dashboard"
            );
        }

        // ==========================
        // VOLUNTEER DASHBOARD
        // ==========================

        if (role === "Volunteer") {

            return res.redirect(
                "/volunteer-dashboard"
            );
        }

        // ==========================
        // ADMIN DASHBOARD
        // ==========================

        if (role === "Admin") {

            return res.redirect(
                "/admin/cms/home"
            );
        }

        res.send("Role Not Found");
    }
);


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