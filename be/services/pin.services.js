const bcrypt = require('bcryptjs')
const bookingKey = require('../models/bookingkey');
// const getGraphClient = require("../graph");
const User = require('../models/User');
const Logsmonitoring = require('../models/Logsmonitoring');

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
    return await bcrypt.compare(pin, booking.key);
}

/**
 * service for delete event record by using eventId
 * @param {string} eventId
 * @returns {boolean}
 */
async function deleteSchedule({ eventId }) {
    const booking = await bookingKey.findOneAndDelete({ 
        id: eventId
    });

    if (!booking) return false;
    /**
     * GraphApi fecth on DELETE method
     */
    // try {
    //     const graphClient = getGraphClient(tokenResponse);
    //     await graphClient
    //         .api(`/users/${booking.room}/events/${eventId}`)
    //         .delete();
    //     console.log(`Event: ${eventId} has been deleted!`);
    // } catch(err) {
    //     console.log(`Failed to delete event from Graph API`, err.message);
    // }
    
    console.log(`DELETE => Event: ${booking.id} has been removed!`);
    return true;
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
        // logsmonitoring create
        const logs = await Logsmonitoring.create({
            user_Id: user._id, 
            L_status: 'Access room', 
            role: user.role, 
            Details: `${user.name} access room ${room_number}`, 
            L_createdAt: new Date(),
        })

        // console.log(`Comparing admin's pin with database`);
        // const isMatch = await bcrypt.compare(pin, user.pin);

        // if (!isMatch) return { success: false, message: "Password does not match!"};
        return { success: true, message: "Password match!" };
    } catch (err) {
        console.log(err.message);
        return { success: false, message: "Internal service error."}
    }
}

module.exports = { compareKey, deleteSchedule, adminCompareKey };