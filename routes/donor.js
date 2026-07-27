const express = require("express");
const multer = require("multer");

const router = express.Router();

const Donation = require("../models/Donation");

const checkRole =
    require("../middleware/roleMiddleware");


// ==========================
// MULTER CONFIG
// ==========================

const storage = multer.diskStorage({

    destination: function(req, file, cb) {

        cb(null, "public/uploads");
    },

    filename: function(req, file, cb) {

        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({
    storage: storage
});


// ==========================
// DONOR DASHBOARD
// ==========================

router.get(

    "/donor-dashboard",

    checkRole(["Restaurant", "Institution"]),

    async (req, res) => {

        // ONLY CURRENT USER DONATIONS

        const donations =
            await Donation.find({

                donorId: req.user._id
            });

        // ANALYTICS

        const totalDonations =
            await Donation.countDocuments({

                donorId: req.user._id
            });

        const availableDonations =
            await Donation.countDocuments({

                donorId: req.user._id,

                status: "Available"
            });

        const deliveredDonations =
            await Donation.countDocuments({

                donorId: req.user._id,

                status: "Delivered"
            });

        res.render("donor/dashboard", {

            donations,

            totalDonations,

            availableDonations,

            deliveredDonations
        });
    }
);


// ==========================
// DONATE PAGE
// ==========================

router.get(

    "/donate",

    checkRole(["Restaurant", "Institution"]),

    (req, res) => {

        res.render("donor/donate");
    }
);


// ==========================
// ADD DONATION
// ==========================

router.post(

    "/donate",

    checkRole(["Restaurant", "Institution"]),

    upload.single("image"),

    async (req, res) => {

        try {

            const {

                foodName,
                quantity,
                location,
                contact

            } = req.body;

            const donation =
                new Donation({

                    foodName,

                    quantity,

                    location,

                    contact,

                    image: req.file.filename,

                    donorId: req.user._id,

                    donorName: req.user.name
                });

            await donation.save();

            res.redirect("/donor-dashboard");

        } catch (error) {

            console.log(error);

            res.send(error.message);
        }
    }
);

module.exports = router;