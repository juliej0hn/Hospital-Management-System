const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    firstName:      { type: String, required: true, trim: true },
    lastName:       { type: String, required: true, trim: true },
    email:          { type: String, required: true, unique: true, lowercase: true },
    password:       { type: String, required: true },   // bcrypt hashed
    role:           { type: String, enum: ['client'], required: true },
    phone:          { type: String },
    medicalHistory: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
