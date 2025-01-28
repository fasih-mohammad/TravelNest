const express = require("express");
const router = express.Router();
const WrapAsync = require("../utils/WrapAsync.js");
const { isLoggedIn } = require("../middleware.js");
const { allBooking, cancelBooking, newBooking, bookingForm, createOrder, handlePaymentSuccess } = require("../controllers/booking.js") ;



router.get(
    "/:id/book",
    isLoggedIn,
    WrapAsync(bookingForm)
);


// Create a new booking
// router.post(
//     "/:id/book",
//     isLoggedIn,
//     WrapAsync(newBooking)
// );

// View user bookings
router.get(
    "/bookings",
    isLoggedIn,
    WrapAsync(allBooking)
);

// Cancel a booking
router.delete(
    "/bookings/:id",
    isLoggedIn,
    WrapAsync(cancelBooking)
);

// Create a Razorpay Order
// router.post(
//     "/create-razorpay-order",
//     isLoggedIn,
//     WrapAsync(createOrder)
// );

router.post(
    "/:id/book",
    isLoggedIn,
    WrapAsync(createOrder)
);

router.post(
    "/bookings/success",
    isLoggedIn,
    WrapAsync(handlePaymentSuccess)
);


module.exports = router;