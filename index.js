import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const corsOptions = ['http://localhost:5173', 'http://localhost:5174']
const app = express();
const port = process.env.PORT || 5000;

app.use(cors({ origin: corsOptions, credentials: true }));
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.CAR_USER}:${process.env.CAR_PASS}@cluster0.qmbsuxs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const run = async () => {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const serviceCollection = client.db('carDoctorDB').collection('services');
        const bookingCollection = client.db('carDoctorDB').collection('bookings');

        // auth related
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            console.log('from jwt', user);
            const token = jwt.sign(user, process.env.TOKEN_SECRET, { expiresIn: '1h' })
            res.cookie('token', token, { httpOnly: true, secure: false}).send({ success: true })
        })

        app.get('/services', async (req, res) => {
            const cursor = serviceCollection.find();
            const result = await cursor.toArray();

            res.send(result);
        })

        app.get('/services/:id', async (req, res) => {
            const s_id = req.params.id;
            const query = { _id: new ObjectId(s_id) };
            const options = { projection: { title: 1, price: 1, service_id: 1, img: 1 } }
            const result = await serviceCollection.findOne(query, options);

            res.send(result);
        })

        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            console.log(booking);
            const result = await bookingCollection.insertOne(booking);
            res.send(result);
        })

        app.get('/bookings', async (req, res) => {
            console.log(req.query);
            console.log('tok tok', req.cookies.token);
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await bookingCollection.find(query).toArray();
            res.send(result)
        })

        app.delete('/bookings/:id', async (req, res) => {
            const delete_id = req.params.id;
            const query = { _id: new ObjectId(delete_id) };
            const result = await bookingCollection.deleteOne(query);

            res.send(result)
        })

        app.patch('/bookings/:id', async (req, res) => {
            const update_id = req.params.id;
            const updatedBooking = req.body;
            console.log(updatedBooking);
            const filter = { _id: new ObjectId(update_id) };
            // const options = { upsert: true }
            const updatedDoc = { $set: { ...updatedBooking } };
            const result = await bookingCollection.updateOne(filter, updatedDoc);

            res.send(result)
        })


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Doctor is Running!')
})

app.listen(port, () => {
    console.log(`Doctor Server is Running on ${port}`);
})