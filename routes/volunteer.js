const express = require("express");

const router = express.Router();

const Donation = require("../models/Donation");

const checkRole =
    require("../middleware/roleMiddleware");


// ==========================
// VOLUNTEER DASHBOARD
// ==========================

router.get(

    "/volunteer-dashboard",

    checkRole(["Volunteer"]),

    async (req, res) => {

        const donations =
            await Donation.find({

                $or: [

                    { status: "Claimed" },

                    { status: "Out for Delivery" },

                    { status: "Delivered" }
                ]
            });

        // Calculate dashboard statistics with safe defaults
        const pendingCount = await Donation.countDocuments({ status: "Claimed" }) || 0;
        const inTransitCount = await Donation.countDocuments({ status: "Out for Delivery" }) || 0;
        const completedCount = await Donation.countDocuments({ status: "Delivered" }) || 0;
        const totalDistance = (inTransitCount + completedCount) * 5 || 0; // Estimate: 5km per delivery

        res.render("volunteer/dashboard", {

            donations,
            pendingCount,
            inTransitCount,
            completedCount,
            totalDistance
        });
    }
);


// ==========================
// ACCEPT DELIVERY
// ==========================

router.get(

    "/accept-delivery/:id",

    checkRole(["Volunteer"]),

    async (req, res) => {

        await Donation.findByIdAndUpdate(

            req.params.id,

            {

                status: "Out for Delivery",

                deliveryPartner: req.user.name
            }
        );

        res.redirect("/volunteer-dashboard");
    }
);


// ==========================
// MARK DELIVERED
// ==========================

router.get(

    "/mark-delivered/:id",

    checkRole(["Volunteer"]),

    async (req, res) => {

        await Donation.findByIdAndUpdate(

            req.params.id,

            {
                status: "Delivered"
            }
        );

        res.redirect("/volunteer-dashboard");
    }
);

module.exports = router;