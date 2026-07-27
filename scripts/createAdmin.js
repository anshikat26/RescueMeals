/**
 * One-time utility to create (or reset) an Admin account.
 *
 * The signup form does not offer the "Admin" role, and passwords are stored as
 * one-way bcrypt hashes (they can never be "viewed" or recovered). Use this
 * script to create a new Admin or reset an existing user's password.
 *
 * Usage (from the project root):
 *   node scripts/createAdmin.js <email> <password> [name]
 *
 * Example:
 *   node scripts/createAdmin.js admin@rescuemeals.com MySecret123 "Site Admin"
 *
 * If the email already exists, its password is reset and role set to Admin.
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/rescuemeals";

async function run() {
    const email = (process.argv[2] || "").trim().toLowerCase();
    const password = process.argv[3];
    const name = process.argv[4] || "Admin";

    if (!email || !password) {
        console.error("Usage: node scripts/createAdmin.js <email> <password> [name]");
        process.exit(1);
    }

    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        const hashedPassword = await bcrypt.hash(password, 10);

        let user = await User.findOne({ email });

        if (user) {
            user.password = hashedPassword;
            user.role = "Admin";
            if (!user.name) user.name = name;
            if (!user.institution) user.institution = "RescueMeals";
            await user.save();
            console.log(`Existing user "${email}" updated: password reset and role set to Admin.`);
        } else {
            user = new User({
                name,
                email,
                password: hashedPassword,
                institution: "RescueMeals",
                role: "Admin"
            });
            await user.save();
            console.log(`Admin user created: ${email}`);
        }

        console.log("You can now log in at /login and you will be redirected to /admin/cms/home");
    } catch (err) {
        console.error("Error creating admin:", err.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

run();
