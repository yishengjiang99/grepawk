const express = require('express')
const app = express()
const httpport = 8080
var bodyParser = require('body-parser')
const db =require("./lib/db");

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "YOUR-DOMAIN.TLD"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(bodyParser.json());


app.post('/table/meta', (req, res) => {

    console.log(req.body.ss);
    debugger;
    // res.send(JSON.stringify(req.params));
    res.end(JSON.stringify(req.body.ss));
})

app.get('/:query', (req, res) => {
    res.end(req.params.query);
})

app.get('/images', (req, res) => {

})
app.get('/images/:query', (req, res) => {
    res.end(req.params.query);
})

app.get('/logs/:query', (req, res) => {
    res.end(req.params.query);
})

app.listen(httpport, () => console.log(`Example app listening on port ${httpport}!`))