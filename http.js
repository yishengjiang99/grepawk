const express = require('express')
const app = express()
const httpport = 8080
var bodyParser = require('body-parser')
const db =require("./lib/db");
const xfs =require("./lib/xfs");


app.use('/', express.static('public'))

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(bodyParser.json());
app.set('view engine', 'pug')


app.get('/:room', (req,res)=>{
 
    
  res.render("")
  res.end(); 
});


app.post('/files/upload', xfs.upload_handler);

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
