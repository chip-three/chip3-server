const mongoose = require('mongoose');

const { Schema } = mongoose;

const data = new Schema({
    data: { type: Object },
    fixtureid:{type: Number, unique:true}, 
    date: {type: String}
});
const Data = mongoose.model('data', data)

module.exports = Data;
