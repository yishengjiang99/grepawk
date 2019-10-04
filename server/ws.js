require('dotenv').config()
const WebSocket = require('ws')
const HttpRequest = require('request');

const fs = require('fs');
const path = require("path");
const port = process.env.ws_port || 8081
const wss = new WebSocket.Server({
    port: port
})
const {
    exec,
    spawn
} = require('child_process');

const db = require("./lib/db");
const crypto = require('crypto');
const xfs = require("./lib/xfs");
const quests = require("./lib/quests");
const gsearch = require("./lib/gsearch");
const geo = require("./lib/geo");

console.log("listening on " + port)

var users = {};
var spawned_procs = {};

const root_path = __dirname + "/world";
const send_json_resonse = function (ws, json) {
    ws.send(JSON.stringify(json));
}

function setUserForWs(ws, user) {
    ws.user = user;
    users[user.uuid] = {
        ws: ws,
        user: user
    }
}

wss.on('connection', (ws, request) => {
    var user;
    ws.on('message', async message => {
        console.log(message);
        try {
            if (user && user.uuid && spawned_procs[user.uuid]) {
                if (message === 'esc') {
                    spawned_procs[user.uuid].kill('SIGINT');
                    delete(spawned_procs[user.uuid]);
                }
                console.log("PROC");
                console.log(spawned_procs[user.uuid]);
                const stdin = spawned_procs[user.uuid].stdin;
                stdin.write(message);
                return;
            }
            var cwd = user ? root_path + user.cwd : root_path;
            var containerName = cwd.replace(root_path + "/", "");
            message = message.trim();
            var t = message.split(" ");
            if (t === "") return;
            var cmd = t[0];
            var args = t.length > 1 ? t.splice(1) : [];

            var cmdSuccessful=false;
            switch (cmd) {
                case 'index':
                    break;
                case 'search':
                    if (args.length < 1) {
                        ws.send("stderr: Usage: search <keyword>");
                        return;
                    }
        		    var argstr = args.join(" ");
        		    var argt = argstr.split("~~~");
        		    var searchTerm = argt[0];
                    pageToken = argt[1] || "";
                    gsearch.find_youtube(encodeURIComponent(argstr), 5, pageToken).then((ret) => {
                        send_json_resonse(ws, {
                            table: ret
                        });
                        if (ret.nextPage) {
                            send_json_resonse(ws, {
                                link: {
                                    url: `onclick: search ${argstr}~~~${ret.nextPage}`,
                                    text: 'more'
                                }
                            });
                        }
                    }).catch((err) => {
                        console.error(err);
                        ws.send("stderr: " + err.message);
                    })
                    break;
                case 'parse':
                    if (args.length < 1) {
                        ws.send("stderr: usage 'parse <url>'");
                    }
                    var parseUrl = args[0];
                    HttpRequest.post({
                        url: "https://grepawk.com/queue/send",
                        json: {
                            url: parseUrl,
                            level: 0
                        }
                    }, (err, res) => {
                        console.log(err);
                        console.log(res);
                        if (err) ws.send("stderr: parse request failed to queue");
                        else ws.send("stdout: parse request queued");
                    });
                    break;
                case 'weather':
                    var opts = await geo.getTempChart(args.join(" "));
                    send_json_resonse(ws, {
                        chart: {
                            opts: opts
                        }
                    })
                    break;
                case 'download':
                    xfs.download_blob(cwd, args[0], ws);
                case 'vcat':
                    xfs.stream_blob(cwd, args[0], ws);
                    break;
                case 'wget':
                    if (args.length !== 1) {
                        ws.send("strderr: Usage: wget $url")
                    }
                    var filename = path.basename(args[0]);
                    const url = args[0].replace("https", "http"); //server-to-server
                    ws.send("stdout: fetching " + url + " to " + filename);
                    HttpRequest.get(url).on("response", _response => {
                        ws.send("stdout: file got");
                        var fh = xfs.get_blob_stream(cwd, filename);
                        var stream = _response.pipe(fh);
                        ws.send("stdout: downloading..");
                        stream.on("finish", () => {
                            ws.send("stdout: downloaded file to " + filename);
                        })
                    });
                    break;
                case 'create_table':
                    ws.send("stdout: Creating table with " + args.join(" "));
                    break;
                case 'table_data':

                    break;
                case 'who':
                    Object.values(users).forEach(_user => {
                        console.log(_user);
                        ws.send("stdout: user: " + _user.user.username);
                    });
                    break;
                case 'tables':  
                    message="\d";
                case 'select':
                    var rows = await db.query(message);
                    var headers = Object.keys(rows[0]); 
                    var json = {
                      'headers': headers,
                      'rows': rows
                    };
                    ws.send(JSON.stringify({
                      table: json
                    }));
                    console.log(rows);
                    ws.send(JSON.stringify({table:rows}));
                    break;
                case 'npm':
                case 'git':
                case 'ps':
                case 'cat':
                case 'node':
                case 'head':
                case 'tail':
                    try {
                        console.log("SPAWN " + cmd + " " + args.join(" "));
                        const sub_proc = spawn(cmd, args, {
                            cwd: cwd
                        });
                        if (user && user.uuid) {
                            spawned_procs[user.uuid] = sub_proc;
                        }
                        if (sub_proc) {
                            ws.send("set-spawn-mode-on");
                        }
                        sub_proc.stdout.on("data", data => {
                            console.log(data);
                            ws.send("stdout: " + data.toString('utf-8'));
                        });
                        sub_proc.stderr.on("data", data => {
                            ws.send("stderr: " + data.toString('utf-8'));
                        });
                        // sub_proc.stdout.on("end", data => {
                        //     ws.send("stdout: " + data.toString('utf-8'));
                        // });
                        sub_proc.on("close", () => {
                            console.log("subproc closee");
                            delete spawned_procs[user.uuid];
                            ws.send("set-spawn-mode-off");
                        });
                        sub_proc.unref();

                    } catch (err) {
                        ws.send("stderr: " + err.message);
                    }
                    break;
                case 'register':
                    if (args.length < 1) {
                        ws.send("Usage: register [username] [password]");
                        break;
                    }
                    let username = args[0];
                    let password = crypto.createHash('md5').update(args[1]).digest('hex');
                    db.update_user(ws.uuid, "username", username);
                    db.update_user(ws.uuid, "password", password);
                    var luser = await db.get_user_with_password(username, password);
                    console.log(luser);
                    setUserForWs(ws, luser);
                    ws.send("stdout: registered username " + username);
                    ws.send(JSON.stringify({
                            userInfo: luser
                        }));
                    break;
                case 'login':
                    if (args.length < 1) {
                        ws.send("Usage: login [username] [password]");
                        break;
                    }
                    let lusername = args[0];
                    let lpassword = crypto.createHash('md5').update(args[1]).digest('hex');
                    var luser = await db.get_user_with_password(lusername, lpassword);
                    if (!luser) {
                        ws.send("stderr: user not found");
                    } else {
                        ws.send(JSON.stringify({
                            userInfo: luser
                        }));
                    }
                    setUserForWs(ws, luser);
                    ws.quests = await quests.list(user);
                    send_json_resonse(ws,{quests:quests});
                    break;
                case 'check-in':
                    const uuid = args[0];
                    user = await db.get_user(uuid, request.headers['x-forwarded-for'] || request.connection.remoteAddress);
                    if (!user) {
                        ws.send("stderr: db error");
                    }
                    setUserForWs(ws, user);
                    cwd = root_path + user.cwd;
                    ws.send(JSON.stringify({
                        userInfo: user
                    }));
                    Object.values(users).forEach(_user => {
                         if(_user.user.uuid !== user.uuid) _user.ws.send("stdout: user " + user.username + " arrived");
                    });
                    ws.quests = await quests.list(user);
                    send_json_resonse(ws,{quests:ws.quests});
                    xfs.send_description(cwd, ws);
                    //xfs.auto_complete_hints(cwd, ws);
                    break;
                case 'shout':
                    console.log('shouting');
                    Object.values(users).forEach(_user => {
                        if (_user.user.uuid == user.uuid) {
                            _user.ws.send("stdout: you shout '" + args.join(" ") + "'");

                        } else {
                            _user.ws.send("stdout: " + _user.user.username + " shouts '" + args.join(" ") + "'");
                        }
                    });
                    break;

                case 'cd':
                    if (args.length < 1) {
                        ws.send("Usage: cd [directory]");
                        break;
                    }
                    var cd_parts = args[0].split("/");
                    var current_pwd = user.cwd.split("/");
                    ws.send("heading to "+args[0]);
                    cd_parts.forEach((elem, index) => {
                        if (elem == '..') {
                            if (current_pwd.length > 0) current_pwd.pop();
                        } else {
                            current_pwd.push(elem);
                        }
                    });
                    user.cwd = current_pwd.join("/");
                    cwd = root_path + "/" + user.cwd;
                    db.update_user(user.uuid, 'cwd', user.cwd);
                    ws.send(JSON.stringify({
                        userInfo: user
                    }));
                    //xfs.init_pwd_container_if_neccessary(cwd);
                    //xfs.list_files_table(cwd, ws);
                    quests.check_quest_completion(message, user, ws);
                    xfs.send_description(cwd, ws);
                    //quests.send_quests(user, ws);
                    //xfs.auto_complete_hints(cwd, ws);
                    break;
                    //break;
                case 'pwd':
                    console.log("user.cwd " + user.cwd);
                    ws.send("stdout: " + (user.cwd || 'root'));
                    break;
                case 'mkdir':
                    if (args.length != 1) {
                        ws.send("stderr: Usage: mkdir <foldername>")
                        return;
                    }
                    xfs.init_pwd_container_if_neccessary(cwd + "/" + args[0]).then(containerName => {
                        ws.send("stdout: " + containerName + " created");
                    }).catch(err => ws.send("stderr: " + err.message));
                case 'ls':
                    xfs.send_description(cwd, ws);

                    //ws.send("You look around in "+cwd);
                   // xfs.auto_complete_hints(cwd, ws);
                    //xfs.list_files_table(cwd, ws);
                case 'echo':
                case 'touch':
                    console.log(cwd);
                    try {
                        console.log("exec msg", message);
                        exec(message, {
                            cwd: cwd
                        }, (err, stdout, stderr) => {
                            if (err) ws.send("error: " + err.message);
                            else {
                                ws.send("stdout: " + stdout);
                                quests.check_quest_completion(message, user, ws);
                            }
                        });
                    } catch (e) {
                        ws.send("stderr: " + e.message);
                    }
                    break;
                default:
                    ws.send("stdout: you say '" + message + "'");
                    break;
            }
        } catch (err) {
            console.log(err);
            ws.send("stderr: " + err.message);
        }
    })
})

require("./http.js");
require("./ice.js");
require("./stream_signal.js");
require("./readStream.js");
require("./writeStream.js");
