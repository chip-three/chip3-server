const mongoose = require('mongoose');

const { Schema } = mongoose;

const history = new Schema({
    address: { type: String },
    matchId:{type: String}, 
    teamId: {type: String},
    amount: {type: String},
    betId: {type: String},
    date: {type: String},
    teamName: {type: String},
    otherteam: {type: String}
});
const History = mongoose.model('history', history)

module.exports = History;
