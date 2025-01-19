const express = require('express');
const { PORT,front_end_origion_url } = require('./config/settings');
const router = require('./routes/index');
const mongoose = require('mongoose');
const dbConnect = require('./database/db');
const controller = require('./controller/controllerauth');
const errorHandler = require('./middlewares/error_handle');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();

// const corsOptions = {
//     credentials: true,
//     origin: '*', // Allow all origins for deployment
// };


const corsOptions = {
    credentials: true,
    origin: front_end_origion_url,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
};


app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: '50mb' })); // to make our app to deal with json data
app.use(router);
app.use('/storage', express.static('storage'));

dbConnect();

app.use(errorHandler);
app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`);
});
