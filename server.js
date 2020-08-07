const express = require('express');
const connectDB = require('./config/db');

// use localhost 3000 if not in production port
const port = process.env.PORT || 3000;
//init app
const app = express();
//Connect to database
connectDB();

//init middleware
app.use(express.json({ extended: false }));

//Define routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/posts', require('./routes/api/post'));

app.listen(port, () => console.log(`server started on port ${port}`));
