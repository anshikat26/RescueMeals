const express = require("express");

const router = express.Router();

const Donation = require("../models/Donation");

const checkRole =
    require("../middleware/roleMiddleware");


// ==========================
// NGO DASHBOARD
// ==========================

router.get(

    "/ngo-dashboard",

    checkRole(["NGO"]),

    async (req, res) => {

        const donations =
            await Donation.find({

                status: "Available"
            });

        // Calculate dashboard statistics with safe defaults
        const claimedCount = await Donation.countDocuments({ status: "Claimed" }) || 0;
        const receivedCount = await Donation.countDocuments({ status: "Delivered" }) || 0;
        const peopleHelped = receivedCount * 10 || 0; // Estimate: 10 people per donation

        res.render("ngo/dashboard", {

            donations,
            claimedCount,
            receivedCount,
            peopleHelped
        });
    }
);


// ==========================
// OPEN CLAIM FORM
// ==========================

router.get(

    "/claim/:id",

    checkRole(["NGO"]),

    async (req, res) => {

        const donation =
            await Donation.findById(
                req.params.id
            );

        res.render("ngo/claim", {

            donation
        });
    }
);


// ==========================
// SAVE CLAIM DETAILS
// ==========================

router.post(

    "/claim/:id",

    checkRole(["NGO"]),

    async (req, res) => {

        const {

            receiverName,

            receiverContact,

            deliveryLocation

        } = req.body;

        await Donation.findByIdAndUpdate(

            req.params.id,

            {

                status: "Claimed",

                receiverName,

                receiverContact,

                deliveryLocation
            }
        );

        res.redirect("/ngo-dashboard");
    }
);

module.exports = router;