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

var Schedule = function () {
    var jobs = []
    var edges_a = []
    var edges_b = []

    return {
        jobs: jobs,
        insert: function (time) {
            time = parseInt(time);
            jobs.push(time)
        },
        get: function (i) {
            i = parseInt(i);
            return jobs[i]
        },
        addEdge: function (a, b) { // b depends on a
            a = parseInt(a);
            b = parseInt(b);
            edges_a.push(a)
            edges_b.push(b)
        },
        is_cyclic: function (i, dependencies) {
            i = parseInt(i);
            var stack = stack || []
            stack.push(i)
            var dependency_counts = new Array(jobs.length).fill(0)

            Object.keys(dependencies).forEach((b) => {
                dependency_counts[b] = dependencies[b].length
            })

            var status = new Array(jobs.length).fill('unvisited')

            while (stack.length) {
                var todo = stack[stack.length - 1]

                if (!dependency_counts[todo] || dependency_counts[todo] === 0) {
                    status[todo] = 'done'
                    stack.pop()
                } else {
                    status[todo] = 'opened'
                    var next = dependencies[todo][dependency_counts[todo] - 1]
                    dependency_counts[todo]--
                    if (status[next] == 'opened') {
                        return true
                    }
                    stack.push(next)
                }
            }
            return false
        },
        start: function (i) { // single source dag, start at job i, work backward, 
            i = parseInt(i);
            console.log(" start *** "+i);
            const v = jobs.length
            const E = edges_a.length
          
            var visited = new Array(v).fill(false)
            var agos = new Array(v).fill(0); //if we want job i to start now, how long ago each job should have started

            var dependencies = []

            edges_b.forEach((b, index) => { // dependencies of b
                a = edges_a[index]
                dependencies[b] = dependencies[b] || []
                dependencies[b].push(a)
            })

            var dependency_counts = new Array(jobs.length).fill(0)

            Object.keys(dependencies).forEach((b) => {
                dependency_counts[b] = dependencies[b].length
            })

           // if (this.is_cyclic(i, dependencies)) return -1

            var compare_fn = function (a, b) {
                return jobs[a] > jobs[b]
            }

            var queue = Queue(compare_fn)

            queue.push(i)
            visited[i] = true
            agos[i] = 0
            var maxAgo = 0;
            var status = new Array(jobs.length).fill('unvisited')
            while (queue.isEmpty() == false) {
                var u = queue.pop()
                console.log("**q popped for "+u);
                visited[u] = true
                dependencies[u] = dependencies[u] || []

                for (var index = 0; index < dependencies[u].length; index++) {
                    let v = dependencies[u][index];
                    if (visited[v] === false || dependency_counts[u]>0) {
                        //console.log(agos[u] + ' vs (' + agos[a] + ' + ' + [a] + ')')
                        if (agos[v] < agos[u] + jobs[v]) {
                            agos[v] = agos[u] + jobs[v]
                            if (agos[v] > maxAgo) {
                                maxAgo = agos[v];
                            }
                            console.log("update " + v + " to start " + agos[v] + " ago ");
                        }
                        dependency_counts[u]--;
                        console.log("pushing " + v + " to queue");
                        queue.push(v)
                    }else if(dependency_counts[v]<0 && visited[v]){
                         return -1;  
                    }else{
                        queue.push(v);
                    }
                }
            }
            console.log(jobs);
            console.log(dependencies);
            return maxAgo;
        },
        finish: function () {
            var size = jobs.length
            var dummy_indes = size
            var edge_n = edges_a.length

            this.insert(0)
            for (i = 0; i < size; i++) {
                this.addEdge(i, dummy_indes)
            }
            console.log(dummy_indes);
            var finish = this.start(dummy_indes)
            jobs.pop()
            edges_a = edges_a.splice(0, edge_n)
            edges_b = edges_b.splice(0, edge_n)
            console.log(' s finishes at ' + finish)
            return finish
        },
        toString: function () {
            return jobs.join(',') + edges_a.join(',')
        },
        reset: function () {
            jobs = []
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
                        return Promise.resolve("Schedule reset");
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
                            return Promise.reject(new Error("Usage: schedule require job_a job_b //job b requires job a"));
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




// var s = Schedule()
// s.insert(1)
// s.insert(2)
// s.insert(3)
// s.addEdge(0, 1)
// s.addEdge(1, 2)
// s.start(1)
// s.finish()

// s.reset()

// for (i = 0; i < 10000; i++) {
//   s.insert(i)
//   if (i > 0) s.addEdge(i - 1, i)
// }
// s.start()

// console.log(s.toString())
// s.start(1)
//  document.write(JSON.stringify(s.jobs))


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
            if (cmd == 'test schedule') {
                const script =
                    `s add 1, 
                s add 2, 
                s add 3, 
                s require 0 1,
                s start 1====1`.split(",");
                this.subject = Schedule();
                return this.test_script(this.subject, script);
            } else if (cmd == 'test schedule2') {
                const script =
                    `s add 1, 
              s add 2, 
              s add 3, 
              s require 0 1,
              s require 1 2, 
              s start 2====3`.split(",");
                this.subject = Schedule();
                return this.test_script(this.subject, script);
            } else if (cmd === 'test sched taylor') {
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
                this.subject = Schedule();
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
test.interpret("test schedule")
test.interpret("test schedule2")
test.interpret("test sched taylor")
