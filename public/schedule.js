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

    var largest = (compare(i, right) && right) ||
      (compare(i, left) && left) ||
      i
    if (largest != i) {
      swap(i, largest)
      max_heapify(largest)
    }
  }
  var _push = function (d) {
    data.push(d)
    shift_up(data.length - 1)
    map[_hashCode(d)] = 1
  }
  var _hashCode = function(d){
      return JSON.stringify(d);
  }
  var _pop = function () {
    if (data.length == 0) return null
    var max = data[0]
    swap(0, data.length - 1)
    delete map[max]
    data.pop()
    max_heapify(0)
    return max
  }
  var _contains = function (d) {
    return typeof map[_hashCode(d)] !== 'undefined'
  }
  var _isEmpty = function () {
    return data.length == 0
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
  var jobs = []
  var edges_a = []
  var edges_b = []

  return {
    jobs: jobs,
    insert: function (time) {
      jobs.push(time)
    },
    get: function (i) {
      return jobs[i]
    },
    addEdge: function (a, b) { // b depends on a
      edges_a.push(a)
      edges_b.push(b)
    },
    is_cyclic: function (i, dependencies) {
      var stack = stack || []
      stack.push(i)
      var dependency_counts = new Array(jobs.length).fill(0)

      Object.keys(dependencies).forEach((b) => {
        dependency_counts[b] = dependencies[b].length
      })

      var status = new Array(jobs.length).fill('unvisited')

      while(stack.length){
        var todo = stack[stack.length-1];

        if (!dependency_counts[todo] || dependency_counts[todo] === 0) {
          status[todo] = 'done'
          stack.pop()
        }else {
          status[todo] = 'opened'
          var next = dependencies[todo][dependency_counts[todo] - 1]
          dependency_counts[todo]--;
          if (status[next] == 'opened') {
            return true
          }
          stack.push(next)
        }
      }
      return false
    },
    start: function (i) { // single source dag, start at job i, work backward, 
      const v = jobs.length
      const E = edges_a.length

      var visited = new Array(v).fill(false)
      var starts = new Array(v).fill(0)

      var dependencies = []
      edges_b.forEach((b, index) => { // dependencies of b
        a = edges_a[index]
        dependencies[b] = dependencies[b] || []
        dependencies[b].push(a)
      })

      if (this.is_cyclic(i,dependencies)) return -1


      var compare_fn = function (a, b) {
        return jobs[a] > jobs[b]
      }

      var queue = Queue(compare_fn)

      queue.push(i)
      visited[i] = true
      starts[i] = 0

      var iteration = 0
      while (queue.isEmpty() == false && iteration++ < 5000) {
        var u = queue.pop()
        console.log('queue pop for ' + u)
        dependencies[u] = dependencies[u] || []
        console.log(u + ' depends on ' + JSON.stringify(dependencies[u]))
        for (index = 0; index < dependencies[u].length; index++) {
          a = dependencies[u][index]
          if (visited[a] === false) {
            queue.push(a)
            console.log(starts[a] + ' vs (' + starts[u] + ' + ' + jobs[u] + ')')
            if (starts[u] < starts[a] + jobs[a]) {
              console.log('setting ')
              starts[u] = starts[a] + jobs[a]
            }
          }
        }
        visited[u] = true
      }
      console.log(i + ' starts at ' + starts[i])
      return starts[i]
    },
    finish: function () {
      var size = jobs.length
      var dummy_indes = size
      var edge_n = edges_a.length

      this.insert(0)
      for (i = 0; i < size; i++) {
        this.addEdge(i, dummy_indes)
      }
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
    }
  }
}

var s = Schedule()
s.insert(1)
s.insert(2)
s.insert(3)
s.addEdge(0, 1)
s.addEdge(1, 2)
s.start(1)
s.finish()

s.reset();

for(i=0; i<10000; i++){
    s.insert(i);
    if(i>0) s.addEdge(i-1, i);
}
s.start();

// console.log(s.toString())
// s.start(1)
//  document.write(JSON.stringify(s.jobs))
