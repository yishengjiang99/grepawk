const fs = require('fs');
const Promise = require("promise");

const xfs = {
    send_description: (pwd, ws)=>{
        xfs.describe(pwd).then(desc => {
            ws.send("stdout: " + desc);
        }).catch(err => {
            ws.send("stderr: " + err.message);
        });
    },
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
