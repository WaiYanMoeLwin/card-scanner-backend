const express = require('express');
const mongoose = require('./db.js');
const inferenceRoute = require('./routes/inference-route.js');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', inferenceRoute);
app.get('/', (req, res) => {
    res.send('Welcome to the Card Scanner API');
});


module.exports = app;