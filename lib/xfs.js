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
    }
}

module.exports = xfs;
