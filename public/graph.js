var Queue = function (compare_fn) {
    var data = []
    var map = {}

    var swap = function (a, b) {
        const tmp = data[a]
        data[a] = data[b]
        data[b] = tmp
    }

    var compare = compare_fn || function (a, b) {

        return data[a] > data[b]
    }

    var shift_up = function (i) {
        var parent = (i - 1) / 2

        if (parent >= 0 && compare(i, parent)) {
            swap(i, parent)
            shift_up(parent)
        }
    }
    var max_heapify = function (i) {
        var left = 2 * i + 1,
            right = 2 * i + 2

        var largest = (right < data.length && compare(right, i) && right) ||
            (left < data.length && compare(left, i) && left) || i;

        if (largest != i) {
            swap(i, largest)
            max_heapify(largest)
        }
    }
    var _push = function (d) {
        data.push(d)
        shift_up(data.length - 1)
        map[_hashCode(d)] = 1
        // console.log(this.toString());
    }
    var _hashCode = function (d) {
        return JSON.stringify(d)
    }
    var _pop = function () {
        //  if (data.length === 0) return null
       //console.log("before swap " + data.length)

        var max = data[0];

        swap(0, data.length - 1)
        //console.log("before maxheapify " + data.length)


        max_heapify(0)
        delete map[max]
       // console.log("before pop " + data.length)

        data.pop()
        //console.log("after pop " + data.length)
        return max
    }
    var _contains = function (d) {
        return typeof map[_hashCode(d)] !== 'undefined'
    }
    var _isEmpty = function () {
        return data.length === 0
    }

    return {
        data: data,
        push: _push,
        contains: _contains,
        isEmpty: _isEmpty,
        pop: _pop,
        toString: function () {
            return "\nsize " + this.data.length + "\n" + data.join(",")
        }
    }
}

var Graph = function () {
    var nodes = []
    var edges_a = []
    var edges_b = []

    return {
        nodes: nodes,
        insert: function (time) {
            time = parseInt(time);
            nodes.push(time)
        },
        get: function (i) {
            i = parseInt(i);
            return nodes[i]
        },
        addEdge: function (a, b) { // b depends on a
            a = parseInt(a);
            b = parseInt(b);
            edges_a.push(a)
            edges_b.push(b)
        },

        start: function (i) { // single source dag, start at job i, work backward, 
            i = parseInt(i);
            console.log(" start *** "+i);
            const v = nodes.length
            const E = edges_a.length
          
            var visited = new Array(v).fill(false)
            var agos = new Array(v).fill(0); //if we want job i to start now, how long ago each job should have started

            var in_edges = []

            edges_b.forEach((b, index) => { // in_edges of b
                a = edges_a[index]
                in_edges[b] = in_edges[b] || []
                in_edges[b].push(a)
            })

            var in_degrees = new Array(nodes.length).fill(0)

            Object.keys(in_edges).forEach((b) => {
                in_degrees[b] = in_edges[b].length
            })

           // if (this.is_cyclic(i, in_edges)) return -1

            var compare_fn = function (a, b) {
                return nodes[a] > nodes[b]
            }
//https://www.youtube.com/watch?v=_LuIvEi_kZk&list=PLSVu1-lON6LyvT8iceopuqnmSmPiSA6wX&index=2
//David Scot Taylor "Topological Order and Topological Sorting"
            var queue = Queue(compare_fn)

            queue.push(i)
            visited[i] = true
            agos[i] = 0
            var maxAgo = 0;
            var status = new Array(nodes.length).fill('unvisited')
            while (queue.isEmpty() == false) {
                var u = queue.pop()
                console.log("**q popped for "+u);
                visited[u] = true
                in_edges[u] = in_edges[u] || []

                for (var index = 0; index < in_edges[u].length; index++) {
                    let v = in_edges[u][index];
                    if (visited[v] === false || in_degrees[u]>0) {
                        //console.log(agos[u] + ' vs (' + agos[a] + ' + ' + [a] + ')')
                        if (agos[v] < agos[u] + nodes[v]) {
                            agos[v] = agos[u] + nodes[v]
                            if (agos[v] > maxAgo) {
                                maxAgo = agos[v];
                            }
                            console.log("update " + v + " to start " + agos[v] + " ago ");
                        }
                        in_degrees[u]--;
                        console.log("pushing " + v + " to queue");
                        queue.push(v)
                    }else if(in_degrees[v]<0 && visited[v]){
                         return -1;  
                    }else{
                        queue.push(v);
                    }
                }
            }
            console.log(nodes);
            console.log(in_edges);
            return maxAgo;
        },
        finish: function () {
            var size = nodes.length
            var dummy_indes = size
            var edge_n = edges_a.length

            this.insert(0)
            for (i = 0; i < size; i++) {
                this.addEdge(i, dummy_indes)
            }
            console.log(dummy_indes);
            var finish = this.start(dummy_indes)
            nodes.pop()
            edges_a = edges_a.splice(0, edge_n)
            edges_b = edges_b.splice(0, edge_n)
            console.log(' s finishes at ' + finish)
            return finish
        },
        toString: function () {
            return nodes.join(',') + edges_a.join(',')
        },
        reset: function () {
            nodes = []
            edges_a = []
            edges_b = []
        },

        interpret: async function (cmd) {
            // cmd = cmd.substring(0,cmd.indexOf("//"));
            cmd_list = cmd.split(" ");

            if ("schedule".indexOf(cmd_list[0]) !== 0) {
                return false;
            }

            var args1 = cmd_list[1] || "";
            args1 = args1.toLowerCase();
            args2 = cmd_list[2] || "";
            switch (args1) {
                case "reset":
                    {
                        this.reset();
                        return Promise.resolve("Graph reset");
                    }
                case "add":
                    {
                        if (!args2 || isNaN(parseInt(args2))) {
                            return Promise.reject(new Error("args 2 must be numeric"));
                        } else {
                            this.insert(args2);
                            return Promise.resolve("Added job length " + args2);
                        }
                    }
                case "require":
                    {
                        if (cmd_list.length < 4) {
                            return Promise.reject(new Error("Usage: Graph require job_a job_b //job b requires job a"));
                        }
                        a = parseInt(cmd_list[2]);
                        b = parseInt(cmd_list[3]);
                        if (isNaN(a) || isNaN(b)) {
                            return Promise.reject(new Error("args 2 and 3 must be integers"));
                        }
                        this.addEdge(cmd_list[2], cmd_list[3]);
                        return Promise.resolve("Job " + b + " requires job " + a);
                    }
                case "start":
                    {

                        if (!args2 || isNaN(parseInt(args2))) {
                            return Promise.reject(new Error("args 2 must be numeric"));
                        } else {
                            args2 = parseInt(args2);
                            return Promise.resolve(this.start(args2));
                        }
                    }
                case "finish":
                    {
                        return Promise.resolve(this.finish());
                    }

            }
        }
    }
}

var Tests = function (subject, debug) {

    debug = debug || true;
    var _subject;


    return {
        subject: _subject,
        assert_equals: async function (expected, cmd) {
            return new Promise(async (resolve, reject) => {
                let result = await this.subject.interpret(cmd);
                if (result === false) reject(new Error("compile error"));
                // console.log("[" + result + "] vs [" + expected + "]");
                if (result === expected) {
                    if (debug) resolve(" test '" + cmd + "' return " + result + " as expected");
                    else resolve(true);
                } else {
                    if (debug) reject(" test " + cmd + " return unespected " + result + " expected: " + expected);
                    else reject(true);
                }
            })
        },
        interpret: function (cmd) {
            if (cmd == 'test Graph') {
                const script =
                    `s add 1, 
                s add 2, 
                s add 3, 
                s require 0 1,
                s start 1====1`.split(",");
                this.subject = Graph();
                return this.test_script(this.subject, script);
            } else if (cmd == 'test Graph2') {
                const script =
                    `s add 1, 
              s add 2, 
              s add 3, 
              s require 0 1,
              s require 1 2, 
              s start 2====3`.split(",");
                this.subject = Graph();
                return this.test_script(this.subject, script);
            } else if (cmd === 'test sch-t') {
                const script =
                    `s add 8, 
            s add 3,
            s add 5,
            s finish====8,
            s require 2 0,
            s finish====13,
            s require 1 0,
            s finish====13,
            s start 0====5,
            s start 1====0,
            s start 2====0,
            s require 2 1,
            s finish====16`.split(",");
                this.subject = Graph();
                return this.test_script(this.subject, script);
            }

            return false;

        },
        test_script: async function (object, script) {
            var failed = 0;
            var success = 0;
            var stdout = [];
            var stderr = [];
            await script.forEach(async line => {
                line = line.trim()
                try {
                    if (line.includes("====")) {
                        t = line.split("====");
                        t[0] = t[0].trim();
                        line = {
                            cmd: t[0].trim(),
                            expected: parseInt(t[1])
                        }
                    } else {
                        line = {
                            cmd: line.trim(),
                            expected: null
                        };
                    }
                    console.log("[" + line.cmd + "]");
                    if (line.expected == null) {
                        object.interpret(line.cmd);
                    } else {
                        let output = await this.assert_equals(line.expected, line.cmd);
                        console.log(output);
                        if (output === false) {
                            failed++;
                            stderr.push(line.cmd + " did not compile.");
                            return;
                        } else {
                            success++;
                            if (typeof output == 'string') stdout.push(output);
                        }
                    }
                } catch (err) {
                    failed++;
                    console.log(err);
                    stderr.push(err);
                }
            })

            return Promise.resolve(true);
        }
    }
}

var test = Tests();
test.interpret("test Graph")
test.interpret("test Graph2")
test.interpret("test sch-t")
