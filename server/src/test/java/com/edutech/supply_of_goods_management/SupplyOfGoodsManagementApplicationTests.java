package com.edutech.supply_of_goods_management;

import com.edutech.supply_of_goods_management.dto.LoginRequest;
import com.edutech.supply_of_goods_management.entity.*;
import com.edutech.supply_of_goods_management.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.aspectj.weaver.ast.Or;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import javax.transaction.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
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
}
