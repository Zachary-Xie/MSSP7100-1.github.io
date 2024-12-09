const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

// Enable CORS for your domain
app.use(cors({
    origin: 'http://your-domain.com' // 开发时使用: 'http://localhost:YOUR_PORT'
}));

const CLIENT_ID = 'YOUR_CLIENT_ID';
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET';

app.get('/oauth/callback', async (req, res) => {
    const code = req.query.code;
    try {
        const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code: code,
            redirect_uri: 'http://localhost:3000/oauth/callback' // 确保与GitHub OAuth App设置匹配
        }, {
            headers: {
                Accept: 'application/json'
            }
        });

        const accessToken = tokenResponse.data.access_token;
        
        // Return a page that sends the token to the opener window
        res.send(`
            <script>
                window.opener.postMessage({token: '${accessToken}'}, '*');
                window.close();
            </script>
        `);
    } catch (error) {
        console.error('Authentication failed:', error);
        res.status(500).send('Authentication failed');
    }
});

app.listen(3000, () => {
    console.log('Auth server running on http://localhost:3000');
}); 