
import static org.junit.Assert.assertEquals;

import org.junit.Test;

public class Tests {
	
	@Test
	public void testEmptySize() {
	      Tree t = new Tree();

	      assertEquals(0,t.size(9));
	      t.insert(100);
	      assertEquals(0,t.size(99));

	}

	@Test
	public void testDuplicate() {
	      Tree t = new Tree();

	      t.insert(9);

	      boolean inserted=t.insert(9);
	      assertEquals(inserted,false);
	      assertEquals(1,t.size(9));

		
	}
	@Test 
	public void testRigthSplitThree() {
	      Tree t = new Tree();

	      t.insert(9);
	      t.insert(10);
	      
	      t.insert(1);
	      //9
	      //1 10
	      

	      t.insert(8);
	      
	      //9
	      //1-8 10

	      
	      t.insert(2);
	      //2-9
	      //1, 8, 10
	      
	      
	      t.insert(3); //first split
	      
	      //2-9
	      //1, 3-8, 10

	      
	      
	      
	      t.insert(11);
	      
	      //2-9
	      //1, 3-8, 10-11
	      
	      t.insert(12);
	      //9
	      //2, 11
	      //1, 3-8, 10, 12
	      
	     
	      
	      
	      assertEquals(1,t.size(12));
	      assertEquals(3,t.size(11));


	      
	      
	      
	}
	@Test 
	public void testLeftThreeSplit() {
	      Tree t = new Tree();

	      t.insert(9);
	      t.insert(10);
	      
	      t.insert(1);
	      //9
	      //1 10
	      

	      t.insert(8);
	      
	      //9
	      //1-8 10

	      
	      t.insert(2);
	      //2-9
	      //1, 8, 10
	      
	      
	      t.insert(3); //first split
	      
	      //2-9
	      //1, 3-8, 10

	      
	      
	      
	      t.insert(-3);
	      
	      //2-9
	      //(-3,1), 3-8, 10
	      
	      t.insert(-1);
	      //2
	      //-1   9
	      //-3, 1,   3-8, 19
	      
	      assertEquals(3,t.size(-1));
	      assertEquals(8,t.size(2));


	      
	      
	      
	}

	@Test
	public void testIncreasing() {
	      Tree t = new Tree();

	      t.insert(9);
	      t.insert(10);
	      t.insert(11);

	      assertEquals(1,t.size(9));
	      assertEquals(3,t.size(10));

	      

		
	}
	@Test
	public void test() {
//		Tree t = new Tree();
//		t.insert(1);
//		assertEquals(t.size(1),1);

		try {
		      Tree t = new Tree();

		      t.insert(9);
		      t.insert(10);
		      
		      t.insert(1);
		      //9
		      //1 10
		      
		      assertEquals(3,t.size(9));
		      assertEquals(1,t.size(10));
		      assertEquals(1,t.size(1));



		      t.insert(8);
		      
		      //9
		      //1-8 10
		      assertEquals(2,t.size(8));
		      
		      t.insert(2);
		      //2-9
		      //1, 8, 10
		      
		      
		      t.insert(3); //first split
		      
		      //2-9
		      //1, 3-8, 10
		      
		      
		      
		      assertEquals(2,t.size(8));
		      assertEquals(2,t.size(3));
		      
		      
		      
		      t.insert(5);
		      //5
		      //2, 9
		      //1,3, 8, 10
		      
		      assertEquals(1,t.size(10));
		      
		      t.insert(4);
		      //5
		      //2, 9
		      //1, 3-4, 8, 10
		      
		      
		      assertEquals(2,t.size(4));
		      
		      t.insert(11);
		      //5
		      //2, 9
		      //1, 3-4, 8, 10-11
		      assertEquals(2,t.size(11));
		      
		      
		      t.insert(12);
		      //5
		      //2, 9-11
		      //1, 3-4, 8, 10, 12
		      assertEquals(5,t.size(11));

		      
		      



		      


		      
		      

		      
		      


		      
			
		}catch(Exception e) {
			
			e.printStackTrace();
		}
		
	



	
		//fail("Not yet implemented");
	}

}
