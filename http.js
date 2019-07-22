
const express = require('express')
const app = express()
const httpport = 8080

app.set('base', '/node');

app.get('/', (req, res) => res.send(200))
app.get('/:query', (req, res) => {
    res.end(req.params.query);
})

app.get('/images', (req, res) =>{

})
app.get('/images/:query', (req, res) =>{
    res.end(req.params.query);
})

app.get('/logs/:query', (req, res) =>{
    res.end(req.params.query);
})

app.listen(httpport, () => console.log(`Example app listening on port ${httpport}!`))

