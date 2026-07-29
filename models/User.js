const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: false
    },

    institution: {
        type: String,
        required: false,
        default: "Individual"
    },

    role: {
        type: String,
        required: true,
        enum: [
            "NGO",
            "Restaurant",
            "Institution",
            "Volunteer",
            "Admin"
        ],
        default: "Volunteer"
    },

    googleId: {
        type: String,
        unique: true,
        sparse: true
    },

    facebookId: {
        type: String,
        unique: true,
        sparse: true
    },

    avatar: {
        type: String
    }

});

module.exports = mongoose.model("User", UserSchema);