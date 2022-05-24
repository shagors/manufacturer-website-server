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

function verifyJWT(req, res, next){
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).send({message: 'UnAuthorized access'});
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){
        if(err){
            return res.status(403).send({message: 'Forbidden access'});
        }
        req.decoded = decoded;
        next();
    });
}


 async function run(){

    try{
        await client.connect();
        const productCollection = client.db('manufacture_Co').collection('products');
        const orderCollection = client.db('manufacture_Co').collection('orders');
        const userCollection = client.db('manufacture_Co').collection('userss');


        

        // products send to ui
        app.get('/product', async(req, res) => {
            const query = {};
            const cursor = productCollection.find(query).project(query);
            const products = await cursor.toArray();
            res.send(products);
        });

        // add products from ui
        app.post('/product', verifyJWT, async(req, res) => {
            const product = req.body;
            const result = await productCollection.insertOne(product);
            res.send(result);
        });

        app.get('/user', verifyJWT, async(req, res) => {
            const users = await userCollection.find().toArray();
            res.send(users);
        });

        app.get('/admin/:email', async(req, res) => {
            const email = req.params.email;
            const user = await userCollection.findOne({email: email});
            const isAdmin = user.role === 'admin';
            res.send({admin: isAdmin});
        });

        app.put('/user/admin/:email', verifyJWT, async(req, res) => {
            const email = req.params.email;
            const requester = req.decoded.email;
            const requesterAccount = await userCollection.findOne({email: requester});
            if(requesterAccount.role === 'admin'){
                const filter = {email: email};
                const updateDoc = {
                    $set: {role: 'admin'},
                };
                const result= await userCollection.updateOne(filter, updateDoc);
                res.send(result);
            }
            else{
                res.status(403).send({message: "Forbidden access"})
            }
        });

        app.put('/user/:email', async(req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = {email: email};
            const options = { upsert: true};
            const updateDoc = {
                $set: user,
            };
            const result= await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({email: email}, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '6h' });
            res.send({result, token});
        });


        app.get('/order', verifyJWT, async(req, res) => {
            const orderUser = req.query.user;
            const decodedEmail = req.decoded.email;
            if(orderUser === decodedEmail){
                const query = {user: orderUser};
                const orderBookings = await orderCollection.find(query).toArray();
                res.send(orderBookings);
            }
            else{
                return res.status(403).send({message: 'Forbidden Access'});
            }
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