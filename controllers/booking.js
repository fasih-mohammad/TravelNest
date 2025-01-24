const Booking = require("../models/booking.js");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");

module.exports.bookingForm = async (req, res) => {
        const { id } = req.params;
        const listing = await Listing.findById(id);

        if (!listing) {
            req.flash("error", "Listing not found!");
            return res.redirect("/listings");
        }

        res.render("listings/book.ejs", { listing });
    }

module.exports.newBooking = async (req, res)=> {
        const { id } = req.params;
        const { checkInDate, checkOutDate } = req.body;
        const listing = await Listing.findById(id);

        if (!listing) {
            req.flash("error", "Listing not found!");
            return res.redirect("/listings");
        }
        // Convert dates to Date objects
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);
        const today = new Date();

        // Validate dates
        if (checkIn < today) {
            req.flash("error", "Check-in date cannot be in the past!");
            return res.redirect(`/listings/${id}/book`);
        }

        if (checkOut <= checkIn) {
            req.flash("error", "Check-out date must be after check-in date!");
            return res.redirect(`/listings/${id}/book`);
        }
        const existingBookings = await Booking.find({
            listingId: id,
            $or: [
                { checkInDate: { $lt: new Date(checkOutDate) }, checkOutDate: { $gt: new Date(checkInDate) } },
            ],
        });
        
        if (existingBookings.length > 0) {
            req.flash("error", "This listing is already booked for the selected dates!");
            return res.redirect(`/listings/${id}`);
        }
        // Calculate total price based on duration and listing price
        const duration = (new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24);
        const totalPrice = listing.price * duration;

        const booking = new Booking({
            listingId: id,
            userId: req.user.id,
            checkInDate,
            checkOutDate,
            totalPrice,
        });

        await booking.save();
        const user = await User.findById(req.user._id);
        user.bookings.push(booking._id);
        await user.save();
        req.flash("success", "Booking created successfully!");
        res.redirect(`/listings/${id}`);
    }

module.exports.allBooking = async (req, res)=> {
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


