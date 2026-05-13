package com.edutech.supply_of_goods_management;

import com.edutech.supply_of_goods_management.dto.LoginRequest;
import com.edutech.supply_of_goods_management.entity.*;
import com.edutech.supply_of_goods_management.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;


import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import javax.transaction.Transactional;



import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Transactional
public class SupplyOfGoodsManagementApplicationTests {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private ProductRepository productRepository;

	@Autowired
	private OrderRepository orderRepository;

	@Autowired
	private InventoryRepository inventoryRepository;

	@Autowired
	private FeedbackRepository feedbackRepository;

	@BeforeEach
	public void setUp() {
		// Clear the database before each test
		userRepository.deleteAll();
		productRepository.deleteAll();
		inventoryRepository.deleteAll();
		feedbackRepository.deleteAll();
		orderRepository.deleteAll();
	}

	// =========================================================================
	// SECTION 1 — Register & Login  (19 existing tests kept + new ones)
	// =========================================================================

	@Test
	public void testRegisterUser() throws Exception {
		String user = "{\n" +
				"    \"username\": \"testUser\",\n" +
				"    \"password\": \"testPassword\",\n" +
				"    \"email\": \"test@example.com\",\n" +
				"    \"role\": \"CONSUMER\"\n" +
				"}";

		// Perform a POST request to the /register endpoint using MockMvc
		mockMvc.perform(post("/api/user/register")
					.contentType(MediaType.APPLICATION_JSON)
					.content(user))
				.andExpect(jsonPath("$.username").value("testUser"))
				.andExpect(jsonPath("$.email").value("test@example.com"))
				.andExpect(jsonPath("$.role").value("CONSUMER"));

		// Assert business is created in the database
		User savedUser = userRepository.findAll().get(0);
		assertEquals("testUser", savedUser.getUsername());
		assertEquals("test@example.com", savedUser.getEmail());
		assertEquals("CONSUMER", savedUser.getRole());
	}


	@Test
	public void testLoginUser() throws Exception {
		String user = "{\n" +
				"    \"username\": \"testUser\",\n" +
				"    \"password\": \"testPassword\",\n" +
				"    \"email\": \"test@example.com\",\n" +
				"    \"role\": \"CONSUMER\"\n" +
				"}";

		// Perform a POST request to the /register endpoint using MockMvc
		mockMvc.perform(post("/api/user/register")
				.contentType(MediaType.APPLICATION_JSON)
				.content(user));
		// Login with the registered user
		LoginRequest loginRequest = new LoginRequest("testUser", "testPassword");

		mockMvc.perform(post("/api/user/login")
					.contentType(MediaType.APPLICATION_JSON)
					.content(objectMapper.writeValueAsString(loginRequest)))
				.andExpect(jsonPath("$.token").exists());
	}

	@Test
	public void testLoginWithWrongUsernameOrPassword() throws Exception {
		// Create a login request with a wrong username
		LoginRequest loginRequest = new LoginRequest("wronguser", "password");

		mockMvc.perform(post("/api/user/login")
					.contentType(MediaType.APPLICATION_JSON)
					.content(objectMapper.writeValueAsString(loginRequest)))
				.andExpect(status().isUnauthorized()); // Expect a 401 Unauthorized response
	}


	@Test
	@WithMockUser(authorities = {"MANUFACTURER"})
	public void testCreateProduct() throws Exception {
		// Register a manufacturer first
		User manufacturer = new User();
		manufacturer.setUsername("manufacturerUser");
		manufacturer.setPassword("testPassword");
		manufacturer.setEmail("manufacturer@example.com");
		manufacturer.setRole("MANUFACTURER");
		userRepository.save(manufacturer);

		// Create a product
		Product product = new Product();
		product.setName("Test Product");
		product.setDescription("Test Description");
		product.setPrice(100.0);
		product.setStockQuantity(50);
		product.setManufacturerId(manufacturer.getId());

		// Perform POST request to create the product
		mockMvc.perform(post("/api/manufacturers/product")
					.contentType(MediaType.APPLICATION_JSON)
					.content(objectMapper.writeValueAsString(product)))
				.andExpect(jsonPath("$.name").value("Test Product"))
				.andExpect(jsonPath("$.description").value("Test Description"))
				.andExpect(jsonPath("$.price").value(100.0))
				.andExpect(jsonPath("$.stockQuantity").value(50));

		// Verify product is created in the database
		Product createdProduct = productRepository.findAll().get(0);
		assertEquals("Test Product", createdProduct.getName());
		assertEquals("Test Description", createdProduct.getDescription());
		assertEquals(100.0, createdProduct.getPrice());
		assertEquals(50, createdProduct.getStockQuantity());
		assertEquals(manufacturer.getId(), createdProduct.getManufacturerId());
	}

	@Test
	@WithMockUser(authorities = {"MANUFACTURER"})
	public void testUpdateProduct() throws Exception {
		// Create a manufacturer user
		User manufacturer = new User();
		manufacturer.setUsername("manufacturerUser");
		manufacturer.setPassword("testPassword");
		manufacturer.setEmail("manufacturer@example.com");
		manufacturer.setRole("MANUFACTURER");
		User savedManufacturer = userRepository.save(manufacturer);

		// Create a Product
		Product product = new Product();
		product.setName("Test Product");
		product.setDescription("This is a test product.");
		product.setPrice(100.0);
		product.setStockQuantity(50);
		product.setManufacturerId(savedManufacturer.getId());
		Product savedProduct = productRepository.save(product);

		// Update the product details
		Product updatedProductDetails = new Product();
		updatedProductDetails.setName("Updated Product");
		updatedProductDetails.setDescription("This is an updated test product.");
		updatedProductDetails.setPrice(150.0);
		updatedProductDetails.setStockQuantity(30);

		// Perform a PUT request to the /api/manufacturers/products/{id} endpoint using MockMvc
		mockMvc.perform(put("/api/manufacturers/product/" + savedProduct.getId())
					.contentType(MediaType.APPLICATION_JSON)
					.content(objectMapper.writeValueAsString(updatedProductDetails)))
				.andExpect(jsonPath("$.name").value("Updated Product"))
				.andExpect(jsonPath("$.description").value("This is an updated test product."))
				.andExpect(jsonPath("$.price").value(150.0))
				.andExpect(jsonPath("$.stockQuantity").value(30));

		// Verify the product was updated in the database
		Product updatedProduct = productRepository.findById(savedProduct.getId()).orElseThrow();
		assertEquals("Updated Product", updatedProduct.getName());
		assertEquals("This is an updated test product.", updatedProduct.getDescription());
		assertEquals(150.0, updatedProduct.getPrice());
		assertEquals(30, updatedProduct.getStockQuantity());
	}

	@Test
	@WithMockUser(authorities = {"MANUFACTURER"})
	public void testGetAllProductsOfManufacturer() throws Exception {
		User manufacturer = new User();
		manufacturer.setUsername("manufacturerUser");
		manufacturer.setPassword("testPassword");
		manufacturer.setEmail("manufacturer@example.com");
		manufacturer.setRole("MANUFACTURER");
		User savedManufacturer = userRepository.save(manufacturer);

		Product product1 = new Product();
		product1.setName("Product 1");
		product1.setDescription("Description 1");
		product1.setPrice(100.0);
		product1.setStockQuantity(20);
		product1.setManufacturerId(savedManufacturer.getId());

		Product product2 = new Product();
		product2.setName("Product 2");
		product2.setDescription("Description 2");
		product2.setPrice(150.0);
		product2.setStockQuantity(30);
		product2.setManufacturerId(savedManufacturer.getId());

		productRepository.save(product1);
		productRepository.save(product2);

		// Perform a GET request to retrieve all products for the manufacturer
		mockMvc.perform(get("/api/manufacturers/products")
					.param("manufacturerId", savedManufacturer.getId().toString()))
				.andExpect(jsonPath("$.length()").value(2))
				.andExpect(jsonPath("$[0].name").value("Product 1"))
				.andExpect(jsonPath("$[1].name").value("Product 2"));
	}

	@Test
	@WithMockUser(authorities = {"WHOLESALER"})
	public void testWholesalerShouldBrowseProducts() throws Exception {
		User manufacturer = createManufacturer();
		// Create and save a few sample products
		Product product1 = new Product();
		product1.setName("Product 1");
		product1.setDescription("Description 1");
		product1.setPrice(100.0);
		product1.setStockQuantity(20);
		product1.setManufacturerId(manufacturer.getId());

		Product product2 = new Product();
		product2.setName("Product 2");
		product2.setDescription("Description 2");
		product2.setPrice(150.0);
		product2.setStockQuantity(30);
		product2.setManufacturerId(manufacturer.getId());

		productRepository.save(product1);
		productRepository.save(product2);

		// Perform a GET request to retrieve all products
		mockMvc.perform(get("/api/wholesalers/products"))
				.andExpect(jsonPath("$.length()").value(2))
				.andExpect(jsonPath("$[0].name").value(product1.getName()))
				.andExpect(jsonPath("$[0].price").value(product1.getPrice()))
				.andExpect(jsonPath("$[0].stockQuantity").value(product1.getStockQuantity()))
				.andExpect(jsonPath("$[1].name").value(product2.getName()))
				.andExpect(jsonPath("$[1].price").value(product2.getPrice()))
				.andExpect(jsonPath("$[1].stockQuantity").value(product2.getStockQuantity()));
	}

	@Test
	@WithMockUser(authorities = {"WHOLESALER"})
	public void testWholesalerShouldPlaceOrder() throws Exception {
		// Create and save a sample product
		Product product = new Product();
		product.setName("Sample Product");
		product.setDescription("Sample Description");
		product.setPrice(100.0);
		product.setStockQuantity(50);
		product.setManufacturerId(createManufacturer().getId());
		productRepository.save(product);

		// Create and save a sample user
		User user = new User();
		user.setUsername("testUser");
		user.setPassword("testPassword");
		user.setEmail("test@example.com");
		user.setRole("WHOLESALER");
		userRepository.save(user);


		Order order = new Order();
		order.setQuantity(10);

		// Perform a POST request to place the order
		mockMvc.perform(post("/api/wholesalers/order")
					.param("productId", product.getId().toString())
					.param("userId", user.getId().toString())
					.contentType(MediaType.APPLICATION_JSON)
					.content(objectMapper.writeValueAsString(order)))
				.andExpect(jsonPath("$.quantity").value(10));

		// Verify the order was saved in the database
		Order placedOrder = orderRepository.findAll().get(0);
		assertEquals(10, placedOrder.getQuantity());
		assertEquals(product.getId(), placedOrder.getProduct().getId());
		assertEquals(user.getId(), placedOrder.getUser().getId());
	}

	@Test
	@WithMockUser(authorities = {"WHOLESALER"})
	public void testWholesalerShouldUpdateOrderStatus() throws Exception {
		// Create and save a sample product
		Product product = new Product();
		product.setName("Sample Product");
		product.setDescription("Sample Description");
		product.setPrice(100.0);
		product.setStockQuantity(50);
		product.setManufacturerId(createManufacturer().getId());
		productRepository.save(product);

		// Create and save a sample user
		User user = new User();
		user.setUsername("testUser");
		user.setPassword("testPassword");
		user.setEmail("test@example.com");
		user.setRole("WHOLESALER");
		userRepository.save(user);

		// Create and save a sample order
		Order order = new Order();
		order.setQuantity(10);
		order.setStatus("PENDING");
		order.setProduct(product);
		order.setUser(user);
		orderRepository.save(order);

		// Perform a PUT request to update the order status
		mockMvc.perform(put("/api/wholesalers/order/" + order.getId())
					.param("status", "SHIPPED"))
				.andExpect(jsonPath("$.status").value("SHIPPED"));

		// Verify the order status was updated in the database
		Order updatedOrder = orderRepository.findById(order.getId()).orElseThrow();
		assertEquals("SHIPPED", updatedOrder.getStatus());
	}

	@Test
	@WithMockUser(authorities = {"WHOLESALER"})
	public void testGetAllWholesalerOrders() throws Exception {
		// Create and save a sample user
		User user = new User();
		user.setUsername("testUser");
		user.setPassword("testPassword");
		user.setEmail("test@example.com");
		user.setRole("WHOLESALER");
		userRepository.save(user);

		// Create and save a sample product
		Product product = new Product();
		product.setName("Sample Product");
		product.setDescription("Sample Description");
		product.setPrice(100.0);
		product.setStockQuantity(50);
		product.setManufacturerId(createManufacturer().getId());
		productRepository.save(product);

		// Create and save a few sample orders for the user
		Order order1 = new Order();
		order1.setQuantity(10);
		order1.setStatus("PENDING");
		order1.setProduct(product);
		order1.setUser(user);
		orderRepository.save(order1);

		Order order2 = new Order();
		order2.setQuantity(20);
		order2.setStatus("SHIPPED");
		order2.setProduct(product);
		order2.setUser(user);
		orderRepository.save(order2);

		// Perform a GET request to retrieve all orders for the user
		mockMvc.perform(get("/api/wholesalers/orders")
					.param("userId", user.getId().toString()))
				.andExpect(jsonPath("$.length()").value(2))
				.andExpect(jsonPath("$[0].quantity").value(10))
				.andExpect(jsonPath("$[1].quantity").value(20));
	}

	@Test
	@WithMockUser(authorities = {"WHOLESALER"})
	public void testAddInventory() throws Exception {
		// Create and save a sample product
		Product product = new Product();
		product.setName("Sample Product");
		product.setDescription("Sample Description");
		product.setPrice(100.0);
		product.setStockQuantity(50);
		product.setManufacturerId(createManufacturer().getId());
		productRepository.save(product);

		Inventory inventory = new Inventory();
		inventory.setWholesalerId(createWholesaler().getId());
		inventory.setStockQuantity(100);

		// Perform a POST request to add the inventory
		mockMvc.perform(post("/api/wholesalers/inventories")
					.param("productId", product.getId().toString())
					.contentType(MediaType.APPLICATION_JSON)
					.content(objectMapper.writeValueAsString(inventory)))
				.andExpect(jsonPath("$.stockQuantity").value(100))
				.andExpect(jsonPath("$.product.id").value(product.getId()));

		// Verify the inventory was saved in the database
		Inventory createdInventory = inventoryRepository.findAll().get(0);
		assertEquals(100, createdInventory.getStockQuantity());
		assertEquals(product.getId(), createdInventory.getProduct().getId());
	}

	@Test
	@WithMockUser(authorities = {"WHOLESALER"})
	public void testUpdateInventory() throws Exception {
		// Create and save a sample product
		Product product = new Product();
		product.setName("Sample Product");
		product.setDescription("Sample Description");
		product.setPrice(100.0);
		product.setStockQuantity(50);
		product.setManufacturerId(createManufacturer().getId());
		productRepository.save(product);

		// Create and save a sample inventory
		Inventory inventory = new Inventory();
		inventory.setWholesalerId(createWholesaler().getId());
		inventory.setStockQuantity(100);
		inventory.setProduct(product);
		inventoryRepository.save(inventory);

		// Perform a PUT request to update the inventory's stock quantity
		mockMvc.perform(put("/api/wholesalers/inventories/" + inventory.getId())
					.param("stockQuantity", "200"))
				.andExpect(jsonPath("$.stockQuantity").value(200));

		// Verify the inventory's stock quantity was updated in the database
		Inventory updatedInventory = inventoryRepository.findById(inventory.getId()).orElseThrow();
		assertEquals(200, updatedInventory.getStockQuantity());
	}

	@Test
	@WithMockUser(authorities = {"WHOLESALER"})
	public void testGetAllInventories() throws Exception {
		// Create and save a sample product
		Product product = new Product();
		product.setName("Sample Product");
		product.setDescription("Sample Description");
		product.setPrice(100.0);
		product.setStockQuantity(50);
		product.setManufacturerId(createManufacturer().getId());
		productRepository.save(product);

		User wholeSaler = createWholesaler();
		// Create and save a few sample inventories for the wholesaler
		Inventory inventory1 = new Inventory();
		inventory1.setWholesalerId(wholeSaler.getId());
		inventory1.setStockQuantity(100);
		inventory1.setProduct(product);
		inventoryRepository.save(inventory1);

		Inventory inventory2 = new Inventory();
		inventory2.setWholesalerId(wholeSaler.getId());
		inventory2.setStockQuantity(200);
		inventory2.setProduct(product);
		inventoryRepository.save(inventory2);

		// Perform a GET request to retrieve all inventories for the wholesaler
		mockMvc.perform(get("/api/wholesalers/inventories")
					.param("wholesalerId", wholeSaler.getId().toString()))
				.andExpect(jsonPath("$.length()").value(2))
				.andExpect(jsonPath("$[0].stockQuantity").value(100))
				.andExpect(jsonPath("$[1].stockQuantity").value(200));
	}

	@Test
	@WithMockUser(authorities = {"CONSUMER"})
	public void testConsumerShouldPlaceOrder() throws Exception {
		// Create and save a sample user
		User user = new User();
		user.setUsername("testUser");
		user.setPassword("testPassword");
		user.setEmail("test@example.com");
		user.setRole("CONSUMER");
		userRepository.save(user);

		// Create and save a sample product
		Product product = new Product();
		product.setName("Sample Product");
		product.setDescription("Sample Description");
		product.setPrice(100.0);
		product.setStockQuantity(50);
		product.setManufacturerId(createManufacturer().getId());
		productRepository.save(product);

		Order order = new Order();
		order.setQuantity(10);

		// Perform a POST request to place the order
		mockMvc.perform(post("/api/consumers/order")
					.param("productId", product.getId().toString())
					.param("userId", user.getId().toString())
					.contentType(MediaType.APPLICATION_JSON)
					.content(objectMapper.writeValueAsString(order)))
				.andExpect(jsonPath("$.quantity").value(10))
				.andExpect(jsonPath("$.user.id").value(user.getId()))
				.andExpect(jsonPath("$.product.id").value(product.getId()));

		// Verify the order was saved in the database
		Order placedOrder = orderRepository.findAll().get(0);
		assertEquals(10, placedOrder.getQuantity());
		assertEquals(user.getId(), placedOrder.getUser().getId());
		assertEquals(product.getId(), placedOrder.getProduct().getId());
	}

	@Test
	@WithMockUser(authorities = {"CONSUMER"})
	public void testConsumerShouldGetAllOrders() throws Exception {
		// Create and save a sample user
		User user = new User();
		user.setUsername("testUser");
		user.setPassword("testPassword");
		user.setEmail("test@example.com");
		user.setRole("CONSUMER");
		userRepository.save(user);

		// Create and save a sample product
		Product product = new Product();
		product.setName("Sample Product");
		product.setDescription("Sample Description");
		product.setPrice(100.0);
		product.setStockQuantity(50);
		product.setManufacturerId(createManufacturer().getId());
		productRepository.save(product);

		// Create and save a few sample orders for the consumer
		Order order1 = new Order();
		order1.setQuantity(2);
		order1.setStatus("PENDING");
		order1.setUser(user);
		order1.setProduct(product);
		orderRepository.save(order1);

		Order order2 = new Order();
		order2.setQuantity(3);
		order2.setStatus("PENDING");
		order2.setUser(user);
		order2.setProduct(product);
		orderRepository.save(order2);

		// Perform a GET request to retrieve all orders for the consumer
		mockMvc.perform(get("/api/consumers/orders")
					.param("userId", user.getId().toString()))
				.andExpect(jsonPath("$.length()").value(2))
				.andExpect(jsonPath("$[0].quantity").value(2))
				.andExpect(jsonPath("$[1].quantity").value(3));
	}

	@Test
	@WithMockUser(authorities = {"CONSUMER"})
	public void testConsumerShouldProvideFeedback() throws Exception {
		// Create and save a sample user
		User user = new User();
		user.setUsername("testUser");
		user.setPassword("testPassword");
		user.setEmail("test@example.com");
		user.setRole("CONSUMER");
		userRepository.save(user);

		// Create and save a sample product
		Product product = new Product();
		product.setName("Sample Product");
		product.setDescription("Sample Description");
		product.setPrice(100.0);
		product.setStockQuantity(50);
		product.setManufacturerId(createManufacturer().getId());
		productRepository.save(product);

		// Create and save a sample order
		Order order = new Order();
		order.setQuantity(2);
		order.setStatus("DELIVERED");
		order.setUser(user);
		order.setProduct(product);
		orderRepository.save(order);

		// Create a sample feedback
		Feedback feedback = new Feedback();
		feedback.setContent("Excellent service!");

		// Perform a POST request to provide feedback for the order
		mockMvc.perform(post("/api/consumers/order/" + order.getId() + "/feedback")
					.param("userId", user.getId().toString())
					.contentType(MediaType.APPLICATION_JSON)
					.content(objectMapper.writeValueAsString(feedback)))
				.andExpect(jsonPath("$.content").value("Excellent service!"));

		// Verify the feedback was saved in the database
		Feedback providedFeedback = feedbackRepository.findAll().get(0);
		assertEquals("Excellent service!", providedFeedback.getContent());
		assertEquals(order.getId(), providedFeedback.getOrder().getId());
	}

	@Test
	@WithMockUser(authorities = {"CONSUMER", "WHOLESALER"})
	public void testManufacturerApiShouldBeForbiddenForOtherUser() throws Exception {
		mockMvc.perform(post("/api/manufacturers/product"))
				.andExpect(status().isForbidden());

		mockMvc.perform(put("/api/manufacturers/product/1"))
				.andExpect(status().isForbidden());

		mockMvc.perform(get("/api/manufacturers/products"))
				.andExpect(status().isForbidden());
	}

	@Test
	@WithMockUser(authorities = {"CONSUMER", "MANUFACTURER"})
	public void testWholesalerApiShouldBeForbiddenForOtherUser() throws Exception {
		mockMvc.perform(get("/api/wholesalers/products"))
				.andExpect(status().isForbidden());

		mockMvc.perform(post("/api/wholesalers/order"))
				.andExpect(status().isForbidden());

		mockMvc.perform(put("/api/wholesalers/order/1"))
				.andExpect(status().isForbidden());

		mockMvc.perform(get("/api/wholesalers/orders"))
				.andExpect(status().isForbidden());

		mockMvc.perform(post("/api/wholesalers/inventories"))
				.andExpect(status().isForbidden());

		mockMvc.perform(put("/api/wholesalers/inventories/1"))
				.andExpect(status().isForbidden());

		mockMvc.perform(get("/api/wholesalers/inventories"))
				.andExpect(status().isForbidden());

	}

	@Test
	@WithMockUser(authorities = {"WHOLESALER", "MANUFACTURER"})
	public void testConsumerApiShouldBeForbiddenForOtherUser() throws Exception {
		mockMvc.perform(get("/api/consumers/products"))
				.andExpect(status().isForbidden());

		mockMvc.perform(post("/api/consumers/order"))
				.andExpect(status().isForbidden());

		mockMvc.perform(get("/api/consumers/orders"))
				.andExpect(status().isForbidden());

		mockMvc.perform(post("/api/consumers/order/1/feedback"))
				.andExpect(status().isForbidden());

	}

	// =========================================================================
	// NEW TESTS — Section 2: User Registration Variations  (20–25)
	// =========================================================================

	@Test
	public void testRegisterManufacturerUser() throws Exception {
		String user = "{\"username\": \"mfgUser\", \"password\": \"mfgPass\", \"email\": \"mfg@example.com\", \"role\": \"MANUFACTURER\"}";
		mockMvc.perform(post("/api/user/register")
				.contentType(MediaType.APPLICATION_JSON).content(user))
				.andExpect(jsonPath("$.role").value("MANUFACTURER"))
				.andExpect(jsonPath("$.username").value("mfgUser"));
		assertEquals(1, userRepository.findAll().size());
	}

	@Test
	public void testRegisterWholesalerUser() throws Exception {
		String user = "{\"username\": \"wsUser\", \"password\": \"wsPass\", \"email\": \"ws@example.com\", \"role\": \"WHOLESALER\"}";
		mockMvc.perform(post("/api/user/register")
				.contentType(MediaType.APPLICATION_JSON).content(user))
				.andExpect(jsonPath("$.role").value("WHOLESALER"))
				.andExpect(jsonPath("$.email").value("ws@example.com"));
	}

	@Test
	public void testLoginReturnsUserIdAndRole() throws Exception {
		String user = "{\"username\": \"roleUser\", \"password\": \"rolePass\", \"email\": \"role@example.com\", \"role\": \"WHOLESALER\"}";
		mockMvc.perform(post("/api/user/register").contentType(MediaType.APPLICATION_JSON).content(user));

		LoginRequest loginRequest = new LoginRequest("roleUser", "rolePass");
		mockMvc.perform(post("/api/user/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(loginRequest)))
				.andExpect(jsonPath("$.token").exists())
				.andExpect(jsonPath("$.role").value("WHOLESALER"))
				.andExpect(jsonPath("$.username").value("roleUser"));
	}

	@Test
	public void testLoginReturnsEmailInResponse() throws Exception {
		String user = "{\"username\": \"emailUser\", \"password\": \"emailPass\", \"email\": \"emailuser@example.com\", \"role\": \"CONSUMER\"}";
		mockMvc.perform(post("/api/user/register").contentType(MediaType.APPLICATION_JSON).content(user));

		LoginRequest loginRequest = new LoginRequest("emailUser", "emailPass");
		mockMvc.perform(post("/api/user/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(loginRequest)))
				.andExpect(jsonPath("$.email").value("emailuser@example.com"));
	}

	@Test
	public void testRegisterUserIsSavedWithEncodedPassword() throws Exception {
		String user = "{\"username\": \"encUser\", \"password\": \"plainPass\", \"email\": \"enc@example.com\", \"role\": \"CONSUMER\"}";
		mockMvc.perform(post("/api/user/register").contentType(MediaType.APPLICATION_JSON).content(user));
		User saved = userRepository.findAll().get(0);
		// password must be encoded — should NOT equal plain text
		assertTrue(!saved.getPassword().equals("plainPass"));
		assertNotNull(saved.getPassword());
	}

	@Test
	public void testLoginWithEmptyPassword() throws Exception {
		LoginRequest loginRequest = new LoginRequest("someUser", "");
		mockMvc.perform(post("/api/user/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(loginRequest)))
				.andExpect(status().isUnauthorized());
	}

	// =========================================================================
	// NEW TESTS — Section 3: Manufacturer Product Variations  (26–32)
	// =========================================================================

	@Test
	@WithMockUser(authorities = {"MANUFACTURER"})
	public void testCreateProductStoresManufacturerId() throws Exception {
		User manufacturer = createManufacturer();
		Product product = new Product();
		product.setName("Track Product");
		product.setDescription("Tracked");
		product.setPrice(200.0);
		product.setStockQuantity(10);
		product.setManufacturerId(manufacturer.getId());

		mockMvc.perform(post("/api/manufacturers/product")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(product)))
				.andExpect(jsonPath("$.manufacturerId").value(manufacturer.getId()));
	}

	@Test
	@WithMockUser(authorities = {"MANUFACTURER"})
	public void testGetAllProductsOfManufacturerReturnsEmptyWhenNone() throws Exception {
		User manufacturer = createManufacturer();
		mockMvc.perform(get("/api/manufacturers/products")
				.param("manufacturerId", manufacturer.getId().toString()))
				.andExpect(jsonPath("$.length()").value(0));
	}

	@Test
	@WithMockUser(authorities = {"MANUFACTURER"})
	public void testGetAllProductsOfManufacturerReturnsSingleProduct() throws Exception {
		User manufacturer = createManufacturer();
		Product product = new Product();
		product.setName("Solo Product");
		product.setDescription("Only one");
		product.setPrice(99.0);
		product.setStockQuantity(5);
		product.setManufacturerId(manufacturer.getId());
		productRepository.save(product);

		mockMvc.perform(get("/api/manufacturers/products")
				.param("manufacturerId", manufacturer.getId().toString()))
				.andExpect(jsonPath("$.length()").value(1))
				.andExpect(jsonPath("$[0].name").value("Solo Product"));
	}

	@Test
	@WithMockUser(authorities = {"MANUFACTURER"})
	public void testUpdateProductPrice() throws Exception {
		User manufacturer = createManufacturer();
		Product product = new Product();
		product.setName("Price Product");
		product.setDescription("Change price");
		product.setPrice(50.0);
		product.setStockQuantity(10);
		product.setManufacturerId(manufacturer.getId());
		Product saved = productRepository.save(product);

		Product update = new Product();
		update.setName("Price Product");
		update.setDescription("Change price");
		update.setPrice(75.0);
		update.setStockQuantity(10);

		mockMvc.perform(put("/api/manufacturers/product/" + saved.getId())
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(update)))
				.andExpect(jsonPath("$.price").value(75.0));

		assertEquals(75.0, productRepository.findById(saved.getId()).orElseThrow().getPrice());
	}

	@Test
	@WithMockUser(authorities = {"MANUFACTURER"})
	public void testUpdateProductStockQuantity() throws Exception {
		User manufacturer = createManufacturer();
		Product product = new Product();
		product.setName("Stock Product");
		product.setDescription("Change stock");
		product.setPrice(100.0);
		product.setStockQuantity(20);
		product.setManufacturerId(manufacturer.getId());
		Product saved = productRepository.save(product);

		Product update = new Product();
		update.setName("Stock Product");
		update.setDescription("Change stock");
		update.setPrice(100.0);
		update.setStockQuantity(99);

		mockMvc.perform(put("/api/manufacturers/product/" + saved.getId())
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(update)))
				.andExpect(jsonPath("$.stockQuantity").value(99));
	}

	@Test
	@WithMockUser(authorities = {"MANUFACTURER"})
	public void testCreateMultipleProductsForSameManufacturer() throws Exception {
		User manufacturer = createManufacturer();
		for (int i = 1; i <= 3; i++) {
			Product p = new Product();
			p.setName("Product " + i);
			p.setDescription("Desc " + i);
			p.setPrice(i * 10.0);
			p.setStockQuantity(i * 5);
			p.setManufacturerId(manufacturer.getId());
			mockMvc.perform(post("/api/manufacturers/product")
					.contentType(MediaType.APPLICATION_JSON)
					.content(objectMapper.writeValueAsString(p)))
					.andExpect(jsonPath("$.name").value("Product " + i));
		}
		assertEquals(3, productRepository.findAll().size());
	}

	// =========================================================================
	// NEW TESTS — Section 4: Wholesaler Order Variations  (33–39)
	// =========================================================================

	@Test
	@WithMockUser(authorities = {"WHOLESALER"})
	public void testWholesalerBrowseProductsWhenEmpty() throws Exception {
		mockMvc.perform(get("/api/wholesalers/products"))
				.andExpect(jsonPath("$.length()").value(0));
	}

	@Test
	@WithMockUser(authorities = {"WHOLESALER"})
	public void testWholesalerOrderStatusUpdatedToDelivered() throws Exception {
		Product product = createSavedProduct();
		User user = createWholesaler();
		Order order = new Order();
		order.setQuantity(5);
		order.setStatus("SHIPPED");
		order.setProduct(product);
		order.setUser(user);
		orderRepository.save(order);

		mockMvc.perform(put("/api/wholesalers/order/" + order.getId())
				.param("status", "DELIVERED"))
				.andExpect(jsonPath("$.status").value("DELIVERED"));

		assertEquals("DELIVERED", orderRepository.findById(order.getId()).orElseThrow().getStatus());
	}

	@Test
	@WithMockUser(authorities = {"WHOLESALER"})
	public void testWholesalerOrderStatusUpdatedToCancelled() throws Exception {
		Product product = createSavedProduct();
		User user = createWholesaler();
		Order order = new Order();
		order.setQuantity(3);
		order.setStatus("PENDING");
		order.setProduct(product);
		order.setUser(user);
		orderRepository.save(order);

		mockMvc.perform(put("/api/wholesalers/order/" + order.getId())
				.param("status", "CANCELLED"))
				.andExpect(jsonPath("$.status").value("CANCELLED"));
	}

	@Test
	@WithMockUser(authorities = {"WHOLESALER"})
	public void testWholesalerGetOrdersReturnsEmptyWhenNone() throws Exception {
		User user = createWholesaler();
		mockMvc.perform(get("/api/wholesalers/orders")
				.param("userId", user.getId().toString()))
				.andExpect(jsonPath("$.length()").value(0));
	}

	@Test
	@WithMockUser(authorities = {"WHOLESALER"})
	public void testWholesalerPlaceOrderSavesProductAndUser() throws Exception {
		Product product = createSavedProduct();
		User user = createWholesaler();
		Order order = new Order();
		order.setQuantity(7);

		mockMvc.perform(post("/api/wholesalers/order")
				.param("productId", product.getId().toString())
				.param("userId", user.getId().toString())
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(order)))
				.andExpect(jsonPath("$.product.id").value(product.getId()))
				.andExpect(jsonPath("$.user.id").value(user.getId()));
	}

	@Test
	@WithMockUser(authorities = {"WHOLESALER"})
	public void testAddInventoryLinksToProduct() throws Exception {
		Product product = createSavedProduct();
		User wholesaler = createWholesaler();
		Inventory inventory = new Inventory();
		inventory.setWholesalerId(wholesaler.getId());
		inventory.setStockQuantity(50);

		mockMvc.perform(post("/api/wholesalers/inventories")
				.param("productId", product.getId().toString())
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(inventory)))
				.andExpect(jsonPath("$.product.name").value(product.getName()));
	}

	@Test
	@WithMockUser(authorities = {"WHOLESALER"})
	public void testUpdateInventoryToZeroStock() throws Exception {
		Product product = createSavedProduct();
		Inventory inventory = new Inventory();
		inventory.setWholesalerId(createWholesaler().getId());
		inventory.setStockQuantity(100);
		inventory.setProduct(product);
		inventoryRepository.save(inventory);

		mockMvc.perform(put("/api/wholesalers/inventories/" + inventory.getId())
				.param("stockQuantity", "0"))
				.andExpect(jsonPath("$.stockQuantity").value(0));

		assertEquals(0, inventoryRepository.findById(inventory.getId()).orElseThrow().getStockQuantity());
	}

	// =========================================================================
	// NEW TESTS — Section 5: Consumer Variations  (40–47)
	// =========================================================================

	@Test
	@WithMockUser(authorities = {"CONSUMER"})
	public void testConsumerBrowseProducts() throws Exception {
		User manufacturer = createManufacturer();
		Product p1 = new Product();
		p1.setName("Consumer Product 1"); p1.setDescription("D1");
		p1.setPrice(25.0); p1.setStockQuantity(15);
		p1.setManufacturerId(manufacturer.getId());
		productRepository.save(p1);

		mockMvc.perform(get("/api/consumers/products"))
				.andExpect(jsonPath("$.length()").value(1))
				.andExpect(jsonPath("$[0].name").value("Consumer Product 1"));
	}

	@Test
	@WithMockUser(authorities = {"CONSUMER"})
	public void testConsumerBrowseProductsWhenEmpty() throws Exception {
		mockMvc.perform(get("/api/consumers/products"))
				.andExpect(jsonPath("$.length()").value(0));
	}

	@Test
	@WithMockUser(authorities = {"CONSUMER"})
	public void testConsumerPlaceOrderSavesCorrectQuantity() throws Exception {
		User user = new User();
		user.setUsername("cUser"); user.setPassword("cPass");
		user.setEmail("c@example.com"); user.setRole("CONSUMER");
		userRepository.save(user);
		Product product = createSavedProduct();
		Order order = new Order();
		order.setQuantity(15);

		mockMvc.perform(post("/api/consumers/order")
				.param("productId", product.getId().toString())
				.param("userId", user.getId().toString())
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(order)))
				.andExpect(jsonPath("$.quantity").value(15));

		assertEquals(15, orderRepository.findAll().get(0).getQuantity());
	}

	@Test
	@WithMockUser(authorities = {"CONSUMER"})
	public void testConsumerGetOrdersReturnsEmptyWhenNone() throws Exception {
		User user = new User();
		user.setUsername("emptyUser"); user.setPassword("pass");
		user.setEmail("empty@example.com"); user.setRole("CONSUMER");
		userRepository.save(user);

		mockMvc.perform(get("/api/consumers/orders")
				.param("userId", user.getId().toString()))
				.andExpect(jsonPath("$.length()").value(0));
	}

	@Test
	@WithMockUser(authorities = {"CONSUMER"})
	public void testConsumerFeedbackIsSavedWithUser() throws Exception {
		User user = new User();
		user.setUsername("fbUser"); user.setPassword("fbPass");
		user.setEmail("fb@example.com"); user.setRole("CONSUMER");
		userRepository.save(user);
		Product product = createSavedProduct();
		Order order = new Order();
		order.setQuantity(1); order.setStatus("DELIVERED");
		order.setUser(user); order.setProduct(product);
		orderRepository.save(order);

		Feedback feedback = new Feedback();
		feedback.setContent("Great product!");

		mockMvc.perform(post("/api/consumers/order/" + order.getId() + "/feedback")
				.param("userId", user.getId().toString())
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(feedback)))
				.andExpect(jsonPath("$.content").value("Great product!"));

		Feedback saved = feedbackRepository.findAll().get(0);
		assertEquals(user.getId(), saved.getUser().getId());
	}

	@Test
	@WithMockUser(authorities = {"CONSUMER"})
	public void testConsumerFeedbackLinksToOrder() throws Exception {
		User user = new User();
		user.setUsername("linkUser"); user.setPassword("lPass");
		user.setEmail("link@example.com"); user.setRole("CONSUMER");
		userRepository.save(user);
		Product product = createSavedProduct();
		Order order = new Order();
		order.setQuantity(2); order.setStatus("DELIVERED");
		order.setUser(user); order.setProduct(product);
		orderRepository.save(order);

		Feedback feedback = new Feedback();
		feedback.setContent("Linked feedback");

		mockMvc.perform(post("/api/consumers/order/" + order.getId() + "/feedback")
				.param("userId", user.getId().toString())
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(feedback)))
				.andExpect(jsonPath("$.content").value("Linked feedback"));

		assertEquals(order.getId(), feedbackRepository.findAll().get(0).getOrder().getId());
	}

	@Test
	@WithMockUser(authorities = {"CONSUMER"})
	public void testConsumerPlaceMultipleOrders() throws Exception {
		User user = new User();
		user.setUsername("multiUser"); user.setPassword("mPass");
		user.setEmail("multi@example.com"); user.setRole("CONSUMER");
		userRepository.save(user);
		Product product = createSavedProduct();

		for (int i = 1; i <= 3; i++) {
			Order order = new Order();
			order.setQuantity(i);
			mockMvc.perform(post("/api/consumers/order")
					.param("productId", product.getId().toString())
					.param("userId", user.getId().toString())
					.contentType(MediaType.APPLICATION_JSON)
					.content(objectMapper.writeValueAsString(order)))
					.andExpect(jsonPath("$.quantity").value(i));
		}
		mockMvc.perform(get("/api/consumers/orders")
				.param("userId", user.getId().toString()))
				.andExpect(jsonPath("$.length()").value(3));
	}

	@Test
	@WithMockUser(authorities = {"CONSUMER"})
	public void testConsumerOrderStatusIsNullByDefault() throws Exception {
		User user = new User();
		user.setUsername("statusUser"); user.setPassword("sPass");
		user.setEmail("status@example.com"); user.setRole("CONSUMER");
		userRepository.save(user);
		Product product = createSavedProduct();
		Order order = new Order();
		order.setQuantity(5);

		mockMvc.perform(post("/api/consumers/order")
				.param("productId", product.getId().toString())
				.param("userId", user.getId().toString())
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(order)))
				.andExpect(jsonPath("$.quantity").value(5));
	}

	// =========================================================================
	// NEW TESTS — Section 6: Inventory and Order Additional  (48–54)
	// =========================================================================

	@Test
	@WithMockUser(authorities = {"WHOLESALER"})
	public void testGetInventoriesForDifferentWholesalers() throws Exception {
		Product product = createSavedProduct();
		User ws1 = createWholesaler();
		User ws2 = new User();
		ws2.setUsername("ws2User"); ws2.setPassword("ws2Pass");
		ws2.setEmail("ws2@example.com"); ws2.setRole("WHOLESALER");
		userRepository.save(ws2);

		Inventory inv1 = new Inventory();
		inv1.setWholesalerId(ws1.getId()); inv1.setStockQuantity(50); inv1.setProduct(product);
		inventoryRepository.save(inv1);

		Inventory inv2 = new Inventory();
		inv2.setWholesalerId(ws2.getId()); inv2.setStockQuantity(80); inv2.setProduct(product);
		inventoryRepository.save(inv2);

		mockMvc.perform(get("/api/wholesalers/inventories")
				.param("wholesalerId", ws1.getId().toString()))
				.andExpect(jsonPath("$.length()").value(1))
				.andExpect(jsonPath("$[0].stockQuantity").value(50));

		mockMvc.perform(get("/api/wholesalers/inventories")
				.param("wholesalerId", ws2.getId().toString()))
				.andExpect(jsonPath("$.length()").value(1))
				.andExpect(jsonPath("$[0].stockQuantity").value(80));
	}

	@Test
	@WithMockUser(authorities = {"WHOLESALER"})
	public void testWholesalerGetOrdersReturnsOnlyOwnOrders() throws Exception {
		Product product = createSavedProduct();
		User ws1 = createWholesaler();
		User ws2 = new User();
		ws2.setUsername("ws2Orders"); ws2.setPassword("pass");
		ws2.setEmail("ws2orders@example.com"); ws2.setRole("WHOLESALER");
		userRepository.save(ws2);

		Order order1 = new Order();
		order1.setQuantity(4); order1.setStatus("PENDING");
		order1.setProduct(product); order1.setUser(ws1);
		orderRepository.save(order1);

		Order order2 = new Order();
		order2.setQuantity(8); order2.setStatus("PENDING");
		order2.setProduct(product); order2.setUser(ws2);
		orderRepository.save(order2);

		mockMvc.perform(get("/api/wholesalers/orders")
				.param("userId", ws1.getId().toString()))
				.andExpect(jsonPath("$.length()").value(1))
				.andExpect(jsonPath("$[0].quantity").value(4));
	}

	@Test
	@WithMockUser(authorities = {"WHOLESALER"})
	public void testInventoryProductLinkIsCorrect() throws Exception {
		Product product = createSavedProduct();
		User wholesaler = createWholesaler();
		Inventory inventory = new Inventory();
		inventory.setWholesalerId(wholesaler.getId());
		inventory.setStockQuantity(30);
		inventory.setProduct(product);
		Inventory saved = inventoryRepository.save(inventory);

		assertEquals(product.getId(), inventoryRepository.findById(saved.getId()).orElseThrow().getProduct().getId());
	}

	@Test
	@WithMockUser(authorities = {"WHOLESALER"})
	public void testAddThenUpdateInventory() throws Exception {
		Product product = createSavedProduct();
		User wholesaler = createWholesaler();
		Inventory inventory = new Inventory();
		inventory.setWholesalerId(wholesaler.getId());
		inventory.setStockQuantity(40);

		String addResponse = mockMvc.perform(post("/api/wholesalers/inventories")
				.param("productId", product.getId().toString())
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(inventory)))
				.andExpect(jsonPath("$.stockQuantity").value(40))
				.andReturn().getResponse().getContentAsString();

		Long invId = objectMapper.readTree(addResponse).get("id").asLong();

		mockMvc.perform(put("/api/wholesalers/inventories/" + invId)
				.param("stockQuantity", "90"))
				.andExpect(jsonPath("$.stockQuantity").value(90));

		assertEquals(90, inventoryRepository.findById(invId).orElseThrow().getStockQuantity());
	}

	@Test
	@WithMockUser(authorities = {"WHOLESALER"})
	public void testWholesalerBrowseProductsReturnsAllProducts() throws Exception {
		User manufacturer = createManufacturer();
		for (int i = 1; i <= 4; i++) {
			Product p = new Product();
			p.setName("WS Browse Product " + i); p.setDescription("D" + i);
			p.setPrice(i * 20.0); p.setStockQuantity(i * 10);
			p.setManufacturerId(manufacturer.getId());
			productRepository.save(p);
		}
		mockMvc.perform(get("/api/wholesalers/products"))
				.andExpect(jsonPath("$.length()").value(4));
	}

	@Test
	public void testRegisterAndLoginWorkflow() throws Exception {
		String userJson = "{\"username\": \"wfUser\", \"password\": \"wfPass\", \"email\": \"wf@example.com\", \"role\": \"CONSUMER\"}";
		mockMvc.perform(post("/api/user/register").contentType(MediaType.APPLICATION_JSON).content(userJson))
				.andExpect(jsonPath("$.username").value("wfUser"));

		LoginRequest loginRequest = new LoginRequest("wfUser", "wfPass");
		mockMvc.perform(post("/api/user/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(loginRequest)))
				.andExpect(jsonPath("$.token").exists())
				.andExpect(jsonPath("$.username").value("wfUser"));
	}

	@Test
	public void testMultipleUsersWithDifferentRolesCanRegister() throws Exception {
		String[] roles = {"CONSUMER", "WHOLESALER", "MANUFACTURER"};
		for (int i = 0; i < roles.length; i++) {
			String userJson = "{\"username\": \"user" + i + "\", \"password\": \"pass" + i + "\", " +
					"\"email\": \"user" + i + "@example.com\", \"role\": \"" + roles[i] + "\"}";
			mockMvc.perform(post("/api/user/register").contentType(MediaType.APPLICATION_JSON).content(userJson))
					.andExpect(jsonPath("$.role").value(roles[i]));
		}
		assertEquals(3, userRepository.findAll().size());
	}

	// =========================================================================
	// Helper methods
	// =========================================================================


	@Test
public void testLoginReturnsUserIdInResponse() throws Exception {

    String user = "{\"username\": \"idUser\", \"password\": \"idPass\", \"email\": \"id@example.com\", \"role\": \"CONSUMER\"}";

    mockMvc.perform(post("/api/user/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content(user));

    LoginRequest loginRequest =
            new LoginRequest("idUser", "idPass");

    mockMvc.perform(post("/api/user/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(loginRequest)))
            .andExpect(jsonPath("$.userId").exists())
            .andExpect(jsonPath("$.token").exists());
}

	@Test
	@WithMockUser(authorities = {"WHOLESALER"})
	public void testWholesalerAddInventoryWithHighStock() throws Exception {
		Product product = createSavedProduct();
		User wholesaler = createWholesaler();
		Inventory inventory = new Inventory();
		inventory.setWholesalerId(wholesaler.getId());
		inventory.setStockQuantity(9999);
		mockMvc.perform(post("/api/wholesalers/inventories")
				.param("productId", product.getId().toString())
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(inventory)))
				.andExpect(jsonPath("$.stockQuantity").value(9999));
		assertEquals(9999, inventoryRepository.findAll().get(0).getStockQuantity());
	}

	@Test
	@WithMockUser(authorities = {"CONSUMER"})
	public void testConsumerOrderHasProductInfo() throws Exception {
		User user = new User();
		user.setUsername("prodInfoUser"); user.setPassword("piPass");
		user.setEmail("pi@example.com"); user.setRole("CONSUMER");
		userRepository.save(user);
		Product product = createSavedProduct();
		Order order = new Order();
		order.setQuantity(3);
		mockMvc.perform(post("/api/consumers/order")
				.param("productId", product.getId().toString())
				.param("userId", user.getId().toString())
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(order)))
				.andExpect(jsonPath("$.product.name").value(product.getName()))
				.andExpect(jsonPath("$.product.price").value(product.getPrice()));
	}

	@Test
	@WithMockUser(authorities = {"WHOLESALER"})
	public void testWholesalerOrderContainsProductInfo() throws Exception {
		Product product = createSavedProduct();
		User user = createWholesaler();
		Order order = new Order();
		order.setQuantity(2);
		mockMvc.perform(post("/api/wholesalers/order")
				.param("productId", product.getId().toString())
				.param("userId", user.getId().toString())
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(order)))
				.andExpect(jsonPath("$.product.name").value(product.getName()));
	}

	@Test
	@WithMockUser(authorities = {"MANUFACTURER"})
	public void testManufacturerCanCreateProductWithZeroStock() throws Exception {
		User manufacturer = createManufacturer();
		Product product = new Product();
		product.setName("Zero Stock"); product.setDescription("No stock");
		product.setPrice(10.0); product.setStockQuantity(0);
		product.setManufacturerId(manufacturer.getId());
		mockMvc.perform(post("/api/manufacturers/product")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(product)))
				.andExpect(jsonPath("$.stockQuantity").value(0));
	}

	@Test
	@WithMockUser(authorities = {"CONSUMER"})
	public void testConsumerGetOrdersReturnsSingleOrder() throws Exception {
		User user = new User();
		user.setUsername("singleOrdUser"); user.setPassword("soPass");
		user.setEmail("single@example.com"); user.setRole("CONSUMER");
		userRepository.save(user);
		Product product = createSavedProduct();
		Order order = new Order();
		order.setQuantity(1); order.setStatus("PENDING");
		order.setUser(user); order.setProduct(product);
		orderRepository.save(order);
		mockMvc.perform(get("/api/consumers/orders")
				.param("userId", user.getId().toString()))
				.andExpect(jsonPath("$.length()").value(1))
				.andExpect(jsonPath("$[0].quantity").value(1));
	}

	@Test
	@WithMockUser(authorities = {"WHOLESALER"})
	public void testWholesalerGetSingleInventory() throws Exception {
		Product product = createSavedProduct();
		User wholesaler = createWholesaler();
		Inventory inv = new Inventory();
		inv.setWholesalerId(wholesaler.getId());
		inv.setStockQuantity(77);
		inv.setProduct(product);
		inventoryRepository.save(inv);
		mockMvc.perform(get("/api/wholesalers/inventories")
				.param("wholesalerId", wholesaler.getId().toString()))
				.andExpect(jsonPath("$.length()").value(1))
				.andExpect(jsonPath("$[0].stockQuantity").value(77));
	}

	private User createManufacturer() {
		User manufacturer = new User();
		manufacturer.setUsername("manufacturerUser");
		manufacturer.setPassword("testPassword");
		manufacturer.setEmail("manufacturer@example.com");
		manufacturer.setRole("MANUFACTURER");
		User savedManufacturer = userRepository.save(manufacturer);
		return savedManufacturer;
	}

	private User createWholesaler() {
		User wholesaler = new User();
		wholesaler.setUsername("wholeslaerUser");
		wholesaler.setPassword("testPassword");
		wholesaler.setEmail("wholeslaerUser@example.com");
		wholesaler.setRole("WHOLESALER");
		User savedWholesaler = userRepository.save(wholesaler);
		return savedWholesaler;
	}

	private Product createSavedProduct() {
		User manufacturer = new User();
		manufacturer.setUsername("mfgHelper" + System.currentTimeMillis());
		manufacturer.setPassword("pass");
		manufacturer.setEmail("mfghelper" + System.currentTimeMillis() + "@example.com");
		manufacturer.setRole("MANUFACTURER");
		userRepository.save(manufacturer);

		Product product = new Product();
		product.setName("Helper Product");
		product.setDescription("Helper Desc");
		product.setPrice(50.0);
		product.setStockQuantity(100);
		product.setManufacturerId(manufacturer.getId());
		return productRepository.save(product);
	}
}
