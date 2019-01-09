const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()

const mountRoutes = require('./routes')
mountRoutes(app)

app.listen(834)
