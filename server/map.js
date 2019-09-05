require('dotenv').config()
const WebSocket = require('ws')
const HttpRequest = require('request');
const fs = require('fs');
const path = require("path");
const port = process.env.map_port || 8081
const fs = require('fs');
const path = require("path");
const port = process.env.ws_port || 8081
const db = require("./lib/db");

const send_json_resonse = function (ws, json) {
    ws.send(JSON.stringify(json));
}

const send_stdout = function (ws, string) {
    ws.send("stdout: " + string);
}


const send_std_err = function (ws, string) {
    ws.send("stderr: " + string);
}

const wss = new WebSocket.Server({
    port: port,
    backlog: 20,
    clientTracking: true,
    maxPayload: 50,
});

var sessions = {}
const add_user_session = async function (ws, request) {
    const session_id = request.header("sec-websocket-key");
    sessions[sessionId] = {
        ws: ws,
        headers: request.headers,
        user: await db.get_user(sessionId) || await db.new_user(session_id, "newuser")
    }
    sessions[sessionId].user.coordinates = sessions[sessionId].user.coordinates || 0 - ;
    return sessions[sessionId].user;
}

var cachedData = {
    map: null,
    users: null,
    files: null
};

var get_area = function (coordinates) {
    var nodes = [],
        edges = [],
        objects = [],
        users = [];
    var name = name;
    var coords = coords;
    var add_node = function (node) {
        node.index = nodes.length;
        nodes.push(node);
        edges.push({});
        objects.push({});
        users.push({});
    }
    var add_edge = function (from, to, weight) {
        edges[from][to] = weight;
    }
    return {
        name: name,
        add_node: add_node,
        add_edge: add_edge,
        add_node_object: function (node_id, object) {
            objects[node_id][object.id] = object;
        },
        add_node_user: function (node_id, user_id) {
            users[node_id][user.id] = user;
        },
    }
}

wss.on("connection", (ws, request) => {
    var user;
    var sessionId;
    var sessionStarted = new Date();
    var availableAchievements = [];

    var validate_input = function () {
        return true;
    }
    var check_for_reconnect = function () {
        return true;
    }
    ws.on("header", async function (ws, headers, request) {
        user = add_user_sesison(ws, request);
        var adjacentFolders = get_area(user.coordinates);
    })
    ws.on("message", async function (message) {
        

    });
});
ws.on("close", (ws, code, reason) => remove_user_session(user));;

const stdin = function (message, ws, request, user) {
    const intepreters = [move, ]
}





const remove_user_session = function (ws) {
    delete delete session[sessionId];
}






//const onWebSocketConnected = 