const express = require('express')
const app = express()
const httpport = 8080
const db =require("./lib/db");
const xfs =require("./lib/xfs");
var admin = require("./routes/admin");


app.set('view engine', 'ejs');



app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


app.use("/admin", admin);
app.use('/', express.static('public'))
app.get('/login', (req,res)=>{
  res.render("login",{time: new Date()});
})



app.post('/files/upload', xfs.upload_handler);

app.get('/:query', (req, res) => {
    res.end(req.params.query);
})


app.listen(httpport, () => console.log(`Example app listening on port ${httpport}!`))
