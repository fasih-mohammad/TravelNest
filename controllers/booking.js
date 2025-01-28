const Booking = require("../models/booking.js");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

module.exports.bookingForm = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    res.render("listings/book.ejs", { listing });
}



module.exports.allBooking = async (req, res) => {
    const bookings = await find({ userId: req.user._id }).populate("listingId");
    res.render("bookings/index.ejs", { bookings });
}

module.exports.cancelBooking = async (req, res) => {
    const { id } = req.params;

    // Find and delete the booking
    const booking = await Booking.findByIdAndDelete(id);

    if (!booking) {
        req.flash("error", "Booking not found!");
        return res.redirect("/profile");
    }

    // Remove the booking from the user's bookings array
    const user = await User.findById(req.user._id);
    user.bookings.pull(id); // Remove the booking ID from the user's bookings array
    await user.save();

    req.flash("success", "Booking cancelled successfully!");
    res.redirect("/profile");
}

// module.exports.newBooking = async (req, res) => {
//     const { id } = req.params;
//     const { checkInDate, checkOutDate } = req.body;
//     const listing = await Listing.findById(id);

//     if (!listing) {
//         req.flash("error", "Listing not found!");
//         return res.redirect("/listings");
//     }
//     // Convert dates to Date objects
//     const checkIn = new Date(checkInDate);
//     const checkOut = new Date(checkOutDate);
//     const today = new Date();

//     // Validate dates
//     if (checkIn < today) {
//         req.flash("error", "Check-in date cannot be in the past!");
//         return res.redirect(`/listings/${id}/book`);
//     }

//     if (checkOut <= checkIn) {
//         req.flash("error", "Check-out date must be after check-in date!");
//         return res.redirect(`/listings/${id}/book`);
//     }
//     const existingBookings = await Booking.find({
//         listingId: id,
//         $or: [
//             { checkInDate: { $lt: new Date(checkOutDate) }, checkOutDate: { $gt: new Date(checkInDate) } },
//         ],
//     });

//     if (existingBookings.length > 0) {
//         req.flash("error", "This listing is already booked for the selected dates!");
//         return res.redirect(`/listings/${id}`);
//     }
//     // Calculate total price based on duration and listing price
//     const duration = (new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24);
//     const totalPrice = listing.price * duration;

//     const booking = new Booking({
//         listingId: id,
//         userId: req.user.id,
//         checkInDate,
//         checkOutDate,
//         totalPrice,
//     });

//     await booking.save();
//     const user = await User.findById(req.user._id);
//     user.bookings.push(booking._id);
//     await user.save();
//     req.flash("success", "Booking created successfully!");
//     res.redirect(`/listings/${id}`);
// }

module.exports.createOrder = async (req, res) => {
    // console.log("Received request to create Razorpay order:", req.body);
    const { listingId, checkInDate, checkOutDate } = req.body;
    // Validate required fields
    if (!listingId || !checkInDate || !checkOutDate) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const listing = await Listing.findById(listingId);
        if (!listing) {
            return res.status(404).json({ error: "Listing not found" });
        }
        const today = new Date();

        // Validate dates
        if (new Date(checkInDate) < today) {
            return res.status(400).json({
                error: "Check-in date cannot be in the past!",
                details: { checkInDate },
            });
        }

        // Validate if checkOut date is after checkIn date
        if (new Date(checkOutDate) <= new Date(checkInDate)) {
            return res.status(400).json({
                error: "Check-out date must be after check-in date!",
                details: { checkInDate, checkOutDate },
            });
        }

        // Check if the listing is already booked for the selected dates
        const existingBookings = await Booking.find({
            listingId: listingId,
            $or: [
                { checkInDate: { $lt: new Date(checkOutDate) }, checkOutDate: { $gt: new Date(checkInDate) } },
            ],
        });

        if (existingBookings.length > 0) {
            return res.status(400).json({
                error: "This listing is already booked for the selected dates!",
                details: { checkInDate, checkOutDate },
            });
        }
        // Calculate total price
        const duration = Math.ceil(
            (new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24)
        ); // Total days
        if (duration <= 0) {
            return res.status(400).json({ error: "Invalid booking dates" });
        }
        const totalPrice = listing.price * duration;

        // Create a Razorpay Order
        const options = {
            amount: totalPrice * 100, // Amount in paise (100 paise = 1 INR)
            currency: "INR",
            receipt: `b_${listingId.slice(0, 10)}_${Date.now()}`, // Short and unique receipt
            payment_capture: 1, // Auto-capture payment
        };
        const order = await razorpay.orders.create(options);
        // console.log('Order created:', order);
        res.status(201).json({
            order,
            totalPrice, // Pass totalPrice to the frontend
        });
    } catch (error) {
        console.error("Error creating Razorpay order:", error);
        res.status(500).json({ error: "Failed to create Razorpay order" });
    }
}

module.exports.handlePaymentSuccess = async (req, res) => {
    const { listingId, checkInDate, checkOutDate, razorpayPaymentId } = req.body;
    // console.log("Received request to handle payment success:", req.body); // Log the req.body
    // Validate required fields
    if (!listingId || !checkInDate || !checkOutDate) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    if (!razorpayPaymentId) {
        return res.status(400).json({ error: "Payment ID is missing" });
    }
    try {
        // Ensure the listing exists
        const listing = await Listing.findById(listingId);
        if (!listing) {
            return res.status(404).json({ error: "Listing not found" });
        }

        // Calculate total price
        const duration = Math.ceil(
            (new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24)
        );
        if (duration <= 0) {
            return res.status(400).json({ error: "Invalid booking dates" });
        }
        const totalPrice = listing.price * duration;

        // Save booking details in the database
        const booking = new Booking({
            listingId,
            userId: req.user._id,
            checkInDate,
            checkOutDate,
            totalPrice,
            paymentId: razorpayPaymentId, // Save Razorpay payment ID
        });

        await booking.save();

        // Add booking to user's bookings array
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        user.bookings.push(booking._id);
        await user.save();

        // console.log("Booking confirmed and saved:", booking);

        req.flash("success", "Booking created successfully!");
        // Send success JSON response to the frontend
        res.status(200).json({
            message: "Payment successfully verified, booking confirmed.",
            bookingDetails: booking, // Optional: Send back the booking details
        });
    } catch (error) {
        console.error("Error handling payment success:", error);
        res.status(500).json({ error: "Failed to confirm booking" });
    }
};
