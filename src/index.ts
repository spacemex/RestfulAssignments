import express from 'express';

import {router} from './routes/router';

const app = express();

const port = process.env.PORT || 3000;
const hostname = process.env.HOSTNAME || '0.0.0.0';

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use('/api/to-do', router);

app.get('/', (req, res) => {
    return res.status(404).json({message: 'route not found'})
});

app.listen(port as number, hostname, -1, () => {
    console.log(`App Started at http://localhost:${port}`);
});