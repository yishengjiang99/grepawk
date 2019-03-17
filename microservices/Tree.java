
import java.util.ArrayList;
import java.util.List;
import java.util.Stack;

public class Tree {

	private Node root;

	public int size(int x) {
		if(root == null) return 0;
		////System.out.println("query for size " + x);
		Node node = root.findNode(x);

		if (null == node)
			return 0;
		else {
			////System.out.println("Node found containing " + x);
			////System.out.println(node);
			int _size = node.countChildNodes();
			////System.out.println("size of nodes in subtree rooted at " + x + " = " + _size);
			return _size;
		}

	}

	public boolean insert(int x) {
		////System.out.println("****Inserting " + x);
		if (null == root) {
			root = new Node(x);
			return true;
		}
		if (this.size(x) > 0)
			return false;
		
		Stack<Node> xpath = new Stack<Node>();
		Node dummy = new Node(); // dummy node before the root in case we need to extend
		xpath.push(dummy);
		Node leaf = root.findLeaf(x, xpath);
		
		////System.out.println("Found leaf with xpath length (including dummy node)" + xpath.size());


		Node parent=null;
		Node cursor = leaf;
		if(cursor.isTwoNode()) {
			////System.out.println("Leaf is 2 node");

			cursor.addVal(x);
			return true;
		}
		
		int newVal = x;
		Node temp4node = null;		
		while (xpath.isEmpty() == false) {
			if(cursor.isTwoNode()) {
				////System.out.println("Leaf is 2 node");

				cursor.addVal(x);
				return true;
			}
			
			parent = xpath.pop();
			
			//at this point node is 3-node and 
			//leaf (on first while loop iteration)
			cursor.initChildrenIfNeeded(); 
			
			int[] sorted = cursor.sortedTreeNodeVals(newVal);
			if(temp4node!=null) {
				List<Node> children = cursor.getChildren();
				Node splitNode = new Node(sorted[2]);
				cursor.v1 = sorted[0];
				cursor.v2 = null; 
				
				Node childSplitNode = new Node();
				childSplitNode.addVal(temp4node.v2);
				
				temp4node.v2 = null;					
				
				for(int i=0; i < children.size();i++) {
					if(temp4node==children.get(i)) {
						switch(i) {
							case 0:{
								splitNode.right = cursor.right;
								cursor.left = temp4node;
								cursor.right =childSplitNode;
								splitNode.left = cursor.middle;
								cursor.middle = null;
								break;
							}
							case 1:{
								splitNode.right= cursor.right;

								cursor.right = temp4node;
								splitNode.left = childSplitNode;
								cursor.middle = null;
								break;
							}
							case 2:{
								splitNode.right = childSplitNode;
								splitNode.left = temp4node;
								splitNode.middle = null;

								cursor.right = cursor.middle;
								cursor.middle = null;
								break;
							}
						}
						break;
					}
				}
				temp4node=null;
				if (parent.isEmpty()) {
					parent.addVal(sorted[1]);
					parent.left = cursor;
					parent.right = splitNode;
					cursor = parent;
					break;
				}else {
					parent.left = cursor;
					parent.right = splitNode;
					newVal = sorted[1];
				}
			}

			if (parent.isEmpty()) {
				parent.addVal(sorted[1]);
				parent.left = new Node(sorted[0]);
				parent.right = new Node(sorted[2]);
				cursor = parent;
				break;
			} else if (parent.isTwoNode()) {
				
				if(x<parent.v1) {
					parent.left = cursor;
					parent.left.v1 =  sorted[0];
					parent.left.v2 =  null;
					parent.middle = new Node(sorted[2]);
				}else {
					parent.right = cursor;
					parent.right.v1 = sorted[2];
					parent.right.v2 =null;
					parent.middle = new Node(sorted[0]);
				}
				parent.addVal(sorted[1]);

				break;
			} else {
				temp4node = cursor;
				temp4node.v1 = sorted[0];
				temp4node.v2 = sorted[2];
				newVal = sorted[1];
				cursor = parent;
			}
		}
		if(cursor == dummy) {
			////System.out.println("root changed ");
			this.root=cursor; //look was change above;
		}else {
			////System.out.println("root not changed ");

		}
		return true;

	}

	class Node {
		Integer v1, v2;
		Node left, middle, right;

		public Node() {

		}

		public Node(int v1) {
			this.v1 = v1;
			this.v2 = null;
		}

		public void addVal(int x) {
			if (v1 == null) {
				v1 = x;
				return;
			}

			if (v2 == null) {
				if (x < v1) {
					v2 = v1;
					v1 = x;
				} else {
					v2 = x;
				}
			}

		}

		public ArrayList<Node> getChildren() {
			ArrayList<Node> children = new ArrayList<Node>();
			children.add(left);
			children.add(middle);
			children.add(right);

			return children;
		}

		public void initChildrenIfNeeded() {
			if (left == null)
				left = new Node();
			if (right == null)
				right = new Node();
			if (middle == null)
				middle = new Node();
		}

		public boolean isLeaf() {
			return (left == null || left.v1==null)
					&& (middle == null || middle.v1==null)
					&& (right == null || right.v1==null);
		}


		public boolean isTwoNode() {
			return v2 == null;
		}

		public Node findNode(int x) {

			if (v1 != null && v1 == x)
				return this;
			if (v2 != null && v2 == x)
				return this;
			if (v1 == null && v2 == null)
				return null;
			if (isLeaf())
				return null;
			Node c = assignChild(x);
			if (c == null)
				return null;
			else
				return c.findNode(x);

		}

		public Node findLeaf(int x, Stack<Node> xpath) {
			if (this.isLeaf()) {
				//////System.out.println("node is leaf");
				return this;
			} else {

				//// .println("node is not leaf, adding " + this + " to xpath");

				xpath.push(this);

				return assignChild(x).findLeaf(x, xpath);
			}
		}


		public Node assignChild(int x) {

			if (isTwoNode()) {
				if (x < v1)
					return left;
				else
					return right;
			} else {
				if (x < v1)
					return left;
				else if (x >= v2)
					return right;
				else
					return middle;
			}
		}

		public boolean isEmpty() {
			return v1 == null;
		}

		public int countChildNodes() {

			int count = 0;
			if (v1 != null)
				count++;
			if (v2 != null)
				count++;
			if (left != null)
				count += left.countChildNodes();
			if (right != null)
				count += right.countChildNodes();
			if (middle != null)
				count += middle.countChildNodes();

			return count;
		}



		public int[] sortedTreeNodeVals(int x) {
			int[] sorted;
			if (x < v1) {
				sorted = new int[] { x, this.v1, this.v2 };
			} else if (x >= this.v2) {
				sorted = new int[] { this.v1, this.v2, x };

			} else {
				sorted = new int[] { this.v1, x, this.v2 };
			}
			return sorted;
		}

	}
}