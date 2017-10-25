const express = require('express');
const db = require('../database/index.js')

const app = express()
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
	console.log(`listening on port ${PORT}`);
})