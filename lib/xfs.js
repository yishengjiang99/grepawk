const fs = require('fs');
const Promise = require("promise");

const xfs = {
    describe: function (pwd) {
        return new Promise((resolve, reject) => {
            fs.access(pwd + "/.description", fs.constants.F_OK, (err) => {
                if (err) resolve("");
                else {
                    fs.readFile(pwd + "/.description", (err, data) => {
                        if (err) reject(err);
                        else resolve(data.toString());
                    })
                }
            })
        });
    },
    auto_complete_hints: (pwd, ws)=>{
        fs.readdir(pwd, (err,items)=>{
            if(err){
                ws.send("stderr: error reading fs");
                return;
            }
            ws.send(JSON.stringify({hints:items}));
        });
    }
}

module.exports = xfs;
