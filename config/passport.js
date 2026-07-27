const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");

const User = require("../models/User");

function initialize(passport) {

    passport.use(
    new LocalStrategy(
        { usernameField: "email" },

        async (email, password, done) => {

            console.log("=================================");
            console.log("Login Attempt");
            console.log("Email:", email);

            const user = await User.findOne({ email });

            console.log("User:", user);

            if (!user) {
                console.log("❌ User not found");
                return done(null, false, { message: "No user found" });
            }

            const isMatch = await bcrypt.compare(password, user.password);

            console.log("Password Match:", isMatch);

            if (isMatch) {
                console.log("✅ Login Success");
                return done(null, user);
            }

            console.log("❌ Incorrect Password");
            return done(null, false, { message: "Incorrect password" });

        }
    )
);

    // Required for persistent login sessions.
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err);
        }
    });

}

module.exports = initialize;