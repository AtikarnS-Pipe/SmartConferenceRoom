const bookingKey = require('../models/bookingkey');
const bcrypt = require('bcryptjs')

/**
 * 
 * @param {string} roomId
 * @param {string|Date} startDate
 * @param {string|Date} endDate
 * @param {string} pin
 * @returns {boolean}
 */
async function compareKey({ room, eventId, pin }) {
    const booking = await bookingKey.findOne({ room, id: eventId });
    if (!booking) return false;
    return await bcrypt.compare(pin, booking.key);
}

module.exports = { compareKey };