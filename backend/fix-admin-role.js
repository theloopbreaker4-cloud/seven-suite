const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/sevencms').then(async () => {
    const db = mongoose.connection.db;
    const users = await db.collection('users').find({},{projection:{email:1,role:1}}).toArray();
    console.log('Users:', JSON.stringify(users));
    const res = await db.collection('users').updateOne(
        { email: 'admin@sevencms.com' },
        { $set: { role: 'admin' } }
    );
    console.log('Updated:', res.modifiedCount);
    process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
