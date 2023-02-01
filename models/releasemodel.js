const mongoose = require('mongoose');
const { Schema } = mongoose;

const release = new Schema({
   matchID: {
    type: String
   },
   released: {
    type: Boolean
   }
});

const Release = mongoose.model('release', release)

module.exports = Release;
