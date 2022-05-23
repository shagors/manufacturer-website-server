const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vs0kl.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


 async function run(){

    try{
        await client.connect();
        const productCollection = client.db('manufacture_Co').collection('products');
        const orderCollection = client.db('manufacture_Co').collection('orders');

        // products send to ui
        app.get('/product', async(req, res) => {
            const query = {};
            const cursor = productCollection.find(query).project(query);
            const products = await cursor.toArray();
            res.send(products);
        });

        app.get('/order', async(req, res) => {
            const orderUser = req.query.user;
            const query = {user: orderUser};
            const orderBookings = await orderCollection.find(query).toArray();
            res.send(orderBookings);

        });

        // Order add when user Book order
        app.post('/order', async(req, res) => {
            const order = req.body;
            // const query = {availableQuan: orderDetails.availableQuan, orderQuantity: orderDetails.orderQuantity}
            const result = await orderCollection.insertOne(order);
            res.send(result);
        });



    }
    finally{

    }

}

run().catch(console.dir)



app.get('/', (req, res) => {
    res.send('Server Connect from Manufacture')
})

app.listen(port, () => {
    console.log(`Manufacturer listen from ${port}`);
})