const bcrypt = require('bcryptjs')
const bookingKey = require('../models/bookingkey');
// const getGraphClient = require("../graph");
const User = require('../models/User');
const { AddLogmonitoring } = require('../utils/AddLogmonitoring');
const { sendMailAsync } = require('../services/sendmail.services');

/**
 * service for compare the pin, user inserted, with the pin of the room in database
 * @param {string} eventId
 * @param {string} pin
 * @returns {boolean}
 */
async function compareKey({ eventId, pin }) {
    console.log(`Comparing pin for event: ${eventId} with pin: ${pin}`);
    const booking = await bookingKey.findOne({ 
        eventId: eventId
    });
    if (!booking) return false;
    console.log(`COMPARING => Pin: ${pin} with Event's key: ${booking.key}`);
    const ismatch =  await bcrypt.compare(pin, booking.key);
    if (ismatch) {
        console.log(`Pin matched for event: ${eventId}`);
        const successlog = await bookingKey.findOneAndUpdate(
            { eventId },
            { isPinVerified: true }, 
            { new: true },
        )
        if (!successlog) return res.status(404).json({ error: "Booking key not found for the given eventId" });
    }

    return ismatch;
}

//! find what unique it is
/**
 * 
 * @param {String} pin
 * @param {String} room_number
 * @returns 
*/
async function adminCompareKey( pin, room_number ) {
    try {
        const user = await User.findOne({
           pin: pin,
        });
        if (!user) return { success: false, message: "User not found!"};
        if (user.role === 'Deactivate') return { success: false, message: "User is Deactivated"};
        /**
         * ! update database to log admin/housekeeper insert pin
         * await log.create({ userId: user._id, action: `access room ${room_number}`, role: user.role, timestamp: new Date() });
         * */
        
        // logsmonitoring function
        const datalogs = {  
            user_Id: user._id, 
            L_status: 'Access room', 
            role: user.role, 
            Details: `${user.name} access room ${room_number}`, 
            L_createdAt: new Date(),
        };
        const log = await AddLogmonitoring(datalogs);

        return { success: true, message: "Password match!" };
    } catch (err) {
        console.log(err.message);
        return { success: false, message: "Internal service error."}
    }
}

module.exports = { compareKey, adminCompareKey };