import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path'; // Import multer for handling file uploads
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Use import.meta.url to get the current module's URL
const __filename = fileURLToPath(import.meta.url);
// Use dirname to get the directory path
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware
app.use(cors()); // Add this line to enable CORS
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/Astro');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Ensure the 'uploads' folder exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });



// Define Product model
const Product = mongoose.model('Product', {
  name: String,
  description: String,
  price: Number,
  imagePath: String,
});

// Handle product upload
app.post('/api/products', upload.single('image'), async (req, res) => {
  try {
    // Check if an image file is provided
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const { name, description, price } = req.body;

    // Create a new product
    const newProduct = new Product({
      name,
      description,
      price,
      imagePath: req.file.filename,
    });

    // Save the product to MongoDB
    await newProduct.save();

    // Respond with success
    res.status(201).json({ message: 'Product uploaded successfully' });
  } catch (error) {
    console.error('Error uploading product:', error.message);
    res.status(500).json({ error: 'Failed to upload product' });
  }
});

// GET route to fetch all products
app.get('/api/products', async (req, res) => {
  try {
    // Fetch all products from the database
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

app.get('/api/products/:productId/download', async (req, res) => {
  try {
    const { productId } = req.params;

    // Log the product ID to check if it's received correctly
    console.log('Product ID:', productId);

    const product = await Product.findById(productId);

    // Log the product to check if it's found
    console.log('Product:', product);

    if (!product || !product.imagePath) {
      return res.status(404).json({ message: 'Product or file not found' });
    }

    const filePath = path.join(__dirname, 'uploads', product.imagePath);

    // Set the appropriate headers for download
    res.setHeader('Content-Disposition', `attachment; filename=${product.imagePath}`);
    res.setHeader('Content-Type', 'image/jpeg');

    // Send the file as binary data
    res.download(filePath, product.imagePath, (err) => {
      if (err) {
        console.error('Error downloading file:', err.message);
        res.status(500).json({ message: 'Server Error' });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// PUT route to update a product
app.put('/api/products/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { name, description, price, imagePath } = req.body;

    // Validate and sanitize data if needed

    // Fetch the existing product
    const existingProduct = await Product.findById(productId);

    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Update the product properties
    existingProduct.name = name || existingProduct.name;
    existingProduct.description = description || existingProduct.description;
    existingProduct.price = price || existingProduct.price;

    // If imagePath is provided, update it
    if (imagePath) {
      // Handle file operations if imagePath is changing
      existingProduct.imagePath = imagePath;
    }

    // Save the updated product
    const updatedProduct = await existingProduct.save();

    res.json({ message: 'Product updated successfully', updatedProduct });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});


// PATCH route to update a product partially
app.patch('/api/products/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const updateFields = req.body;

    // Validate and sanitize data if needed

    // Fetch the existing product
    const existingProduct = await Product.findById(productId);

    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Update the product properties based on the fields provided
    Object.keys(updateFields).forEach((field) => {
      existingProduct[field] = updateFields[field];
    });

    // Save the updated product
    const updatedProduct = await existingProduct.save();

    res.json({ message: 'Product updated successfully', updatedProduct });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// DELETE route to delete a product
app.delete('/api/products/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const deletedProduct = await Product.findOneAndDelete({ _id: productId });

    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Respond with success
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
