const express = require('express');
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const app = express();
const cors = require('cors');
require('dotenv').config();

const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tllgu.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function run() {
    try {
        await client.connect();
        const database = client.db('car_shop');
        const carsCollection = database.collection('cars');
        const usersCollection = database.collection('users');
        const reviewsCollection = database.collection('reviews');

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

        // GET REVIEWS API
        app.get('/reviews', async (req, res) => {
            const cursor = reviewsCollection.find({});
            const reviews = await cursor.toArray();
            res.send(reviews);
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