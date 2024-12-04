require('dotenv').config();
const express = require('express');
const axios = require('axios');
const OAuth = require('oauth-1.0a');
const cors = require('cors');

const crypto = require('crypto');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3001;

app.use(bodyParser.json());
app.use(express.static('public'));

app.post('/create-tweet', async (req, res) => {
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ error: 'Status is required' });
    }

    const oauth = OAuth({
        consumer: {
            key: process.env.API_KEY,
            secret: process.env.API_SECRET
        },
        signature_method: 'HMAC-SHA1',
        hash_function(base_string, key) {
            return crypto.createHmac('sha1', key).update(base_string).digest('base64');
        }
    });

    const token = {
        key: process.env.ACCESS_TOKEN,
        secret: process.env.ACCESS_SECRET
    };

    const requestData = {
        url: 'https://api.twitter.com/1.1/statuses/update.json',
        method: 'POST',
        data: {
            status
        }
    };

    try {
        const authHeader = oauth.toHeader(oauth.authorize(requestData, token));

        const response = await axios.post(requestData.url, new URLSearchParams(requestData.data), {
            headers: {
                ...authHeader,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: error.response ? error.response.data : error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
