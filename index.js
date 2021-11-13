const express = require('express');
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const app = express();
const cors = require('cors');
require('dotenv').config();
const admin = require("firebase-admin");

const port = process.env.PORT || 5000;

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tllgu.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function verifyToken(req, res, next) {
    if (req.headers?.authorization?.startsWith('Bearer ')) {
        const token = req.headers.authorization.split(' ')[1];

        try {
            const decodedUser = await admin.auth().verifyIdToken(token);
            req.decodedEmail = decodedUser.email;
        }
        catch {

        }

    }
    next();
}

async function run() {
    try {
        await client.connect();
        const database = client.db('car_shop');
        const carsCollection = database.collection('cars');
        const usersCollection = database.collection('users');
        const reviewsCollection = database.collection('reviews');
        const ordersCollection = database.collection('orders');

        // GET CARS API
        app.get('/cars', async (req, res) => {
            const cursor = carsCollection.find({});
            const cars = await cursor.toArray();
            res.send(cars);
        })
        // GET SINGLE CARS API
        app.get('/cars/buying/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const car = await carsCollection.findOne(query);
            res.json(car);
        })

        // GET SINGLE ORDER
        app.get('/allOrders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const order = await ordersCollection.findOne(query);
            res.json(order);
        })

        // ADD ORDER
        app.post("/addOrders", async (req, res) => {
            const order = req.body;
            const result = await ordersCollection.insertOne(order);
            res.send(result);
        });

        // GET ALL ORDERS
        app.get("/allOrders", async (req, res) => {
            const result = await ordersCollection.find({}).toArray();
            res.send(result);
            console.log(result);
        });

        // GET MY ORDERS
        app.get('/myOrders', verifyToken, async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            console.log(query)
            const cursor = ordersCollection.find(query);
            const myOrders = await cursor.toArray();
            res.json(myOrders);
        })

        // UPDATE BUTTON SHIPPED/ PUT API
        app.put('/allOrders/:id', async (req, res) => {
            const id = req.params.id;
            const updatedShipped = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    status: updatedShipped.status
                }
            };
            const result = await ordersCollection.updateOne(filter, updateDoc, options)
            console.log('updating pending to shipped', id);
            res.json(result);
        })

        // DELETE API FOR ORDER
        app.delete('/allOrders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await ordersCollection.deleteOne(query);
            res.json(result);
        })

        // GET REVIEWS API
        app.get('/reviews', async (req, res) => {
            const cursor = reviewsCollection.find({});
            const reviews = await cursor.toArray();
            res.send(reviews);
        })

        // POST API / ADD REVIEW
        app.post('/reviews', async (req, res) => {
            const review = req.body;
            console.log('Hitting the post api', review);
            const result = await reviewsCollection.insertOne(review);
            console.log(result);
            res.json(result);
        });

        // GET SERVICE API
        app.get('/cars', async (req, res) => {
            const cursor = carsCollection.find({});
            const cars = await cursor.toArray();
            res.send(cars);
        })

        // ADD SERVICE
        app.post('/cars', async (req, res) => {
            const car = req.body;
            const result = await carsCollection.insertOne(car);
            res.json(result);
        });

        // GET USERS ACCORDING TO EMAIL
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            console.log(email);
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            console.log(user);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin })
        })

        // Collect Users by API
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            console.log(result);
            res.json(result);
        })

        // Update Users
        app.put('/users', async (req, res) => {
            const user = req.body;
            console.log(user);
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });

        // Update User to be Admin and verify by JWT
        app.put('/users/admin', verifyToken, async (req, res) => {
            const user = req.body;
            const requester = req.decodedEmail;
            if (requester) {
                const requesterAccount = await usersCollection.findOne({ email: requester });
                if (requesterAccount.role === 'admin') {
                    const filter = { email: user.email };
                    const updateDoc = { $set: { role: 'admin' } };
                    const result = await usersCollection.updateOne(filter, updateDoc);
                    res.json(result);
                }
            }
            else {
                res.status(403).json({ message: 'you do not have access to make admin' })
            }

        })
    }
    finally {
        // await client.close();
    }
}

run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Car Selling Server is running');
})

app.listen(port, () => {
    console.log('Car Selling is running on the port :', port);
})