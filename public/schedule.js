var Queue = function (compare_fn) {
    var data = [];
    var map = {};

    var swap = function (a, b) {
        const tmp = data[a];
        data[a] = data[b];
        data[b] = tmp;
    }

    var compare = compare_fn || function (a, b) {
        return data[a] > data[b];
    }

    var shift_up = function (i) {
        var parent = (i - 1)/2;

        if (parent >= 0 && compare(i, parent)) {
            swap(i, parent);
            shift_up(parent);
        }
    }
    var max_heapify = function (i) {
        var left = 2 * i + 1,
            right = 2 * i + 2;

        var largest = (compare(i, right) && right) ||
            (compare(i, left) && left) ||
            i;
        if (largest != i) {
            swap(i, largest);
            max_heapify(largest);
        }
    }
    var _push =  function (d) {
        data.push(d);
        shift_up(data.length - 1);
        map[d.toString]=1;
    };
    var _pop = function () {
        if(data.length == 0) return null;
        var max = data[0];
        swap(0, data.length-1);
        delete map[max];
        data.pop();
        max_heapify(0);
        return max;
    }
    var _contains = function(d){
        return typeof map[d.toString] !== 'undefined';

    }
    var _isEmpty = function(){
        return data.length == 0;
    }

    return {
        data: data,
        push: _push, 
        contains: _contains,
        isEmpty: _isEmpty,
        pop: _pop
    }
}

var Schedule = function () {
    var jobs = [];
    var edges_a = [];
    var edges_b = [];

    return {
        jobs: jobs,
        insert: function (time) {
            jobs.push(time);

        },
        get: function (i) {
            return jobs[i];
        },
        addEdge: function (a, b) {
            edges_a.push(a);
            edges_b.push(b);
        },
        start: function (i) {
            const v = jobs.length;
            const E = edges_a.length;
            var visited = new Array(v).fill(false);
            var starts = new Array(v).fill(-1);
            var dependencies =[];

            edges_b.forEach((b, index)=>{
                a = edges_a[index];
                dependencies[b] =  dependencies[b] || [];
                dependencies[b].push(a);
            })

            var compare_fn = function (a, b) {
                return jobs[a] > jobs[b];
            }

            var queue = Queue(compare_fn);
            
            queue.push(i);
            visited[i]=true;
            starts[i]=0;

            var iteration = 0;
            while (queue.isEmpty()==false && iteration++<5) {
                var u = queue.pop();
               
                dependencies[u] = dependencies[u] || [];
                console.log(dependencies[u]);
              //  if(visited[u]===true) return -1;
                dependencies[u].forEach((a, index)=>{
                    if(visited[a] === false){
                        queue.push(a);
                        if(starts[a] < starts[u] + jobs[u]){
                            starts[a] = starts[u] + jobs[u];
                        }
                    }
                })
                visited[u]=true;
            }
            console.log(i+" starts at "+starts[i]);
            return starts[i];
        },
        finish: function () {
            var size = jobs.length;
            var dummy_indes = size;
            var edge_n = edges_a.length;
    
            this.insert(0);
            for(i =0; i<size; i++){
                this.addEdge(i, dummy_indes);
            }
            var finish = this.start(dummy_indes);
            jobs.pop();
            edges_a = edges_a.splice(0,edge_n);
            edges_b = edges_b.splice(0,edge_n);
            return finish;
        },
        toString: function () {
            return jobs.join(",") + edges_a.join(",");
        }
    }
}

var s = Schedule();

s.insert(1)
s.insert(2)
s.insert(3)
s.addEdge(0, 1);
s.addEdge(1, 2);
s.start(0);
s.start(1);
s.finish();

//console.log(s.toString());
//s.start(1);
//  document.write(JSON.stringify(s.jobs));
