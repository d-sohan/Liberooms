const mongoose = require('mongoose');

const detailSchema = new mongoose.Schema({
    furniture: String,
    parking: String,
    carpetArea: Number,
    facing: String,
    floor: String,
    Electricity: Boolean,
    Internet: Boolean,
    Water: Boolean,
});

const applicationSchema = new mongoose.Schema({
    fname: String,
    lname: String,
    email: String,
    timestamp: String,
    accepted: Boolean
});

const reviewSchema = new mongoose.Schema({
    fname: String,
    lname: String,
    email: String,
    rating: Number,
    details: String
});

const adSchema = new mongoose.Schema({
    active: Boolean,
    rent: Number,
    ownerEmail: String,
    availability: String,
    tenantPreference: String,
    type: String,
    size: String,

    details: detailSchema,

    houseNumber: Number,
    street: String,
    city: String,
    pin: Number,
    state: String,
    country: String,

    houseId: mongoose.ObjectId, // invisible

    applications: [mongoose.ObjectId],
    reviews: [mongoose.ObjectId]
});

const utilitySchema = new mongoose.Schema({
    timestamp: String,
    subject: String,
    details: String,
    handled: Boolean
});


const houseSchema = new mongoose.Schema({
    houseNumber: {
        type: Number,
        trim: true
    },
    street: {
        type: String,
        trim: true
    },
    city: {
        type: String,
        trim: true
    },
    pin: {
        type: Number,
        trim: true
    },
    state: {
        type: String,
        trim: true
    },
    country: {
        type: String,
        trim: true
    },
    occupantEmail: String,
    ownerEmail: String,
    occupied: Boolean,
    adId: mongoose.ObjectId,
    complaints: [utilitySchema],
    notifications: [utilitySchema],
    requests: [utilitySchema]
});

module.exports.houseModel = mongoose.model('House', houseSchema);