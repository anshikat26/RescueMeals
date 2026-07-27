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
        required: true
    },

    institution: {
        type: String,
        required: true
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
        ]
    },

    

});

module.exports = mongoose.model("User", UserSchema);