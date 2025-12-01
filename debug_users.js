import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { UserModel } from './models/user.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');

        const users = await UserModel.find({});
        console.log(`Total users: ${users.length}`);

        console.log('---------------------------------------------------');
        console.log('| Email | Role | Name | FirebaseUID |');
        console.log('---------------------------------------------------');
        users.forEach(u => {
            console.log(`| ${u.email} | ${u.role} | ${u.name} | ${u.firebaseUid} |`);
        });
        console.log('---------------------------------------------------');

        // Group by role
        const byRole = users.reduce((acc, u) => {
            acc[u.role] = (acc[u.role] || 0) + 1;
            return acc;
        }, {});
        console.log('Counts by role:', byRole);

        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
