import express from 'express';

import {router} from './routes/router'

const app = express();

const port = process.env.PORT || 3000;
const hostname = process.env.HOSTNAME || "0.0.0.0";

app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.use('/api', router);

app.get('/', (req, res) => {
    return res.status(404).json({message: 'Not Found'});
});

app.listen(port as number, hostname, -1, () => {
    console.log(`App started at http://localhost:${port}`);
});