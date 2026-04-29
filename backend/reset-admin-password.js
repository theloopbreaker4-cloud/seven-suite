const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');

const EMAIL    = 'admin@sevencms.com';
const PASSWORD = process.argv[2] || 'Admin123!';

(async () => {
    await mongoose.connect('mongodb://127.0.0.1:27017/sevencms');
    const hash = await bcrypt.hash(PASSWORD, 10);
    const res  = await mongoose.connection.db
        .collection('users')
        .updateOne(
            { email: EMAIL },
            { $set: { password: hash, role: 'admin', isActive: true } }
        );
    console.log('MongoDB sevencms:', res.modifiedCount, 'row(s) updated. Password:', PASSWORD);
    process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
