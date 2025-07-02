const bcrypt = require('bcryptjs')
const bookingKey = require('../models/bookingkey');
const getGraphClient = require("../graph");

/**
 * service for compare the pin, user inserted, with the pin of the room in database
 * @param {string} eventId
 * @param {string} pin
 * @returns {boolean}
 */
async function compareKey({ eventId, pin }) {
    const booking = await bookingKey.findOne({ 
        id: eventId
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


// //! find what unique it is
// /**
//  * 
//  * @param {String} unique
//  * @param {String} pin
//  * @param {String} room_number
//  * @returns 
//  */
// async function adminCompareKey({ unique, pin, room_number }) {
//     try {
//         const user = await User.findOne({
//             // unique: unique,
//         });

//         if (!user) return { success: false, message: "User not found!"};

//         /**
//          * ! update database to log admin/housekeeper insert pin
//          * await log.create({ userId: user._id, action: `access room ${room_number}`, role: user.role, timestamp: new Date() });
//          * */

//         console.log(`Comparing admin's pin with database`);
//         const isMatch = await bcrypt.compare(pin, user.pin);

//         if (!isMatch) return { success: false, message: "Password does not match!"};
//         return { success: true, message: "Password match!" };
//     } catch (err) {
//         console.log(err.message);
//         return { success: false, message: "Internal service error."}
//     }
// }
// //! export the function

module.exports = { compareKey, deleteSchedule };