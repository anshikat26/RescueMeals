const LocalStrategy = require("passport-local").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const bcrypt = require("bcryptjs");

const User = require("../models/User");

function initialize(passport) {

    // Local Strategy
    passport.use(
        new LocalStrategy(
            { usernameField: "email" },

            async (email, password, done) => {
                try {
                    console.log("=================================");
                    console.log("Login Attempt");
                    console.log("Email:", email);

                    const user = await User.findOne({ email });

                    if (!user) {
                        console.log("❌ User not found");
                        return done(null, false, { message: "No user found" });
                    }

                    if (!user.password) {
                        console.log("❌ User registered via social authentication");
                        return done(null, false, { message: "Please sign in using Google or Facebook" });
                    }

                    const isMatch = await bcrypt.compare(password, user.password);

                    console.log("Password Match:", isMatch);

                    if (isMatch) {
                        console.log("✅ Login Success");
                        return done(null, user);
                    }

                    console.log("❌ Incorrect Password");
                    return done(null, false, { message: "Incorrect password" });
                } catch (err) {
                    return done(err);
                }
            }
        )
    );

    // Google Strategy - only register if credentials are configured
    const googleClientID = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const googleCallbackURL = process.env.GOOGLE_CALLBACK_URL || "/auth/google/callback";

    if (googleClientID && googleClientID.trim() !== "") {
        passport.use(
            new GoogleStrategy(
                {
                    clientID: googleClientID,
                    clientSecret: googleClientSecret,
                    callbackURL: googleCallbackURL
                },
                async (accessToken, refreshToken, profile, done) => {
                    try {
                        console.log("Google Auth Profile ID:", profile.id);
                        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : `${profile.id}@google.com`;
                        const name = profile.displayName || (profile.name ? `${profile.name.givenName || ''} ${profile.name.familyName || ''}`.trim() : "Google User");
                        const avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : "";

                        // 1. Find by googleId
                        let user = await User.findOne({ googleId: profile.id });
                        if (user) {
                            return done(null, user);
                        }

                        // 2. Find by email
                        user = await User.findOne({ email });
                        if (user) {
                            user.googleId = profile.id;
                            if (!user.avatar && avatar) user.avatar = avatar;
                            await user.save();
                            return done(null, user);
                        }

                        // 3. Create new user
                        user = new User({
                            name,
                            email,
                            googleId: profile.id,
                            avatar,
                            institution: "Individual",
                            role: "Volunteer"
                        });
                        await user.save();
                        return done(null, user);
                    } catch (err) {
                        console.error("Google Auth Error:", err);
                        return done(err);
                    }
                }
            )
        );
        console.log("✅ Google OAuth strategy registered.");
    } else {
        console.log("⚠️  Google OAuth not configured — GOOGLE_CLIENT_ID is missing in .env");
    }

    // Facebook Strategy - only register if credentials are configured
    const facebookAppID = process.env.FACEBOOK_APP_ID;
    const facebookAppSecret = process.env.FACEBOOK_APP_SECRET;
    const facebookCallbackURL = process.env.FACEBOOK_CALLBACK_URL || "/auth/facebook/callback";

    if (facebookAppID && facebookAppID.trim() !== "") {
        passport.use(
            new FacebookStrategy(
                {
                    clientID: facebookAppID,
                    clientSecret: facebookAppSecret,
                    callbackURL: facebookCallbackURL,
                    profileFields: ["id", "displayName", "emails", "photos"]
                },
                async (accessToken, refreshToken, profile, done) => {
                    try {
                        console.log("Facebook Auth Profile ID:", profile.id);
                        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : `facebook_${profile.id}@facebook.com`;
                        const name = profile.displayName || "Facebook User";
                        const avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : "";

                        // 1. Find by facebookId
                        let user = await User.findOne({ facebookId: profile.id });
                        if (user) {
                            return done(null, user);
                        }

                        // 2. Find by email
                        user = await User.findOne({ email });
                        if (user) {
                            user.facebookId = profile.id;
                            if (!user.avatar && avatar) user.avatar = avatar;
                            await user.save();
                            return done(null, user);
                        }

                        // 3. Create new user
                        user = new User({
                            name,
                            email,
                            facebookId: profile.id,
                            avatar,
                            institution: "Individual",
                            role: "Volunteer"
                        });
                        await user.save();
                        return done(null, user);
                    } catch (err) {
                        console.error("Facebook Auth Error:", err);
                        return done(err);
                    }
                }
            )
        );
        console.log("✅ Facebook OAuth strategy registered.");
    } else {
        console.log("⚠️  Facebook OAuth not configured — FACEBOOK_APP_ID is missing in .env");
    }

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