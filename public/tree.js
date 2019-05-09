var Tree = function(){

  //implicit 3-node array bastardization of "Heap Lab"
  //   http://www.cs.sjsu.edu/~taylor/term/spring19/CS146/ProgrammingAssignments/heapLab.shtml
  //draft #37 for 
  //   http://www.cs.sjsu.edu/~taylor/term/spring19/CS146/ProgrammingAssignments/23Program.shtml
  
  var data = [null,null,null];
  var map = {};                //hash_map
  
  var _insert = function(x){
    if(map[x]) return false;
    map[x]=1; 

    var stack = [];
    stack.push(0);

    var going_down = true;

    while(stack.length){
      const c = stack[stack.length-1];
      if(going_down === true && c < data.length / 3){          //non-leaf
          for(var i = 0; i < 3; i++){
            if(data[c+i] > x){
               stack.push(c*3+i+1);
               break;
            }
          }
      }else{                                                  //leaf, or in bubble-up
        var shift_from = 0;
        for(; shift_from < 3; shift_from++){
          if(data[c+shift_from] === null){
            data[c+shift_from] = x;
            return true;
          }else if(data[c+shift_from] > x){
            break;
          }
        }

        x = data[c+1];
        for(var i = 2; i >= shift_from && i >=1; i--){
            data[i] = data [i-i] || null;
        }
        going_down = false;
        stack.pop();
      }
    }
  }
  return {
    insert:_insert
  }
}



var t = Tree();
t.insert(1)
t.insert(2)
