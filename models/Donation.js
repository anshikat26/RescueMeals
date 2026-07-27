const mongoose = require("mongoose");

const DonationSchema = new mongoose.Schema({

    foodName: {
        type: String,
        required: true
    },

    quantity: {
        type: String,
        required: true
    },

    location: {
        type: String,
        required: true
    },

    contact: {
        type: String,
        required: true
    },

    image: {
        type: String
    },

    status: {
        type: String,
        default: "Available"
    },

    deliveryPartner: {
        type: String,
        default: ""
    },

    donorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    donorName: {
        type: String
    },

    // NGO DELIVERY DETAILS

    receiverName: {
        type: String,
        default: ""
    },

    receiverContact: {
        type: String,
        default: ""
    },

    deliveryLocation: {
        type: String,
        default: ""
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});

module.exports =
    mongoose.model("Donation", DonationSchema);