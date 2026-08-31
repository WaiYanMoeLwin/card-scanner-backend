const express = require('express');
const mongoose = require('./db.js');
const inferenceRoute = require('./routes/inference-route.js');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
}));

app.use('/api', inferenceRoute);
app.get('/', (req, res) => {
    res.send('Welcome to the Card Scanner API');
});


module.exports = app;