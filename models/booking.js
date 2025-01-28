const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
    listingId: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    checkInDate: { type: Date, required: true },
    checkOutDate: { type: Date, required: true },
    totalPrice: { type: Number, required: true },
    paymentId: { type: String }, // Razorpay payment ID
    status: { type: String, default: "pending" }, // e.g., pending, confirmed, cancelled
}, {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
});

// Optionally, you can add indexes to optimize queries
bookingSchema.index({ listingId: 1 });
bookingSchema.index({ userId: 1 });

module.exports = mongoose.model("Booking", bookingSchema);
