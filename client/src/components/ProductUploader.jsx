import { useState, useEffect } from 'react';
import axios from 'axios';

const ProductUploader = () => {
  const [productData, setProductData] = useState({
    name: '',
    description: '',
    price: '',
    image: null,
  });
  const [products, setProducts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/products');
        const fetchedProducts = response.data;

        // Save products data to local storage
        localStorage.setItem('products', JSON.stringify(fetchedProducts));

        setProducts(fetchedProducts);
      } catch (error) {
        console.error('Error fetching products:', error.message);
      }
    };

    fetchProducts();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProductData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    setProductData((prevData) => ({
      ...prevData,
      image: e.target.files[0],
    }));
  };

  const handleUpdate = async () => {
    try {
      const response = await axios.put(
        `http://localhost:3000/api/products/${editingProductId}`,
        productData
      );

      // Update state or fetch products again
      const updatedProducts = products.map((product) =>
        product._id === editingProductId ? response.data : product
      );

      setProducts(updatedProducts);
      console.log('Product updated successfully');
      setEditingProductId(null);
      setIsEditing(false);
      setProductData({
        name: '',
        description: '',
        price: '',
        image: null,
      });
    } catch (error) {
      console.error('Error updating product:', error.message);
    }
  };

  const handleEdit = (productId) => {
    const productToEdit = products.find((product) => product._id === productId);
    setProductData(productToEdit);
    setEditingProductId(productId);
    setIsEditing(true);
  };

  const handleDelete = async (productId) => {
    try {
      await axios.delete(`http://localhost:3000/api/products/${productId}`);

      // Update state or fetch products again
      const updatedProducts = products.filter((product) => product._id !== productId);

      setProducts(updatedProducts);
      console.log('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error.message);
    }
  };

  
  const handleDownload = async (productId) => {
    try {
      const response = await axios.get(`http://localhost:3000/api/products/${productId}/download`, {
        responseType: 'arraybuffer',
      });
  
      const contentDisposition = response.headers['content-disposition'];
      const fileName = contentDisposition ? contentDisposition.split('filename=')[1] : `product_${productId}.jpg`;
  
      const blob = new Blob([response.data], { type: 'image/jpeg' });
  
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = fileName;
  
      document.body.appendChild(link);
      link.click();
  
      document.body.removeChild(link);
      console.log('Download successful');
    } catch (error) {
      console.error('Error downloading product:', error.message);
      // Handle the error, display a user-friendly message, or log more details as needed
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('name', productData.name);
    formData.append('description', productData.description);
    formData.append('price', productData.price);
    formData.append('image', productData.image);

    try {
      if (isEditing) {
        // If in edit mode, update the product
        await handleUpdate();
      } else {
        // If in create mode, upload a new product
        await axios.post('http://localhost:3000/api/products', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        console.log('Product uploaded successfully');
      }
    } catch (error) {
      console.error('Error handling submission:', error.message);
    }
  };

  return (
    <div>
      <div>
        <h2>Product Uploader</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Product Name:
            <input
              type="text"
              name="name"
              value={productData.name}
              onChange={handleInputChange}
            />
          </label>
          <br />
          <label>
            Product Description:
            <textarea
              name="description"
              value={productData.description}
              onChange={handleInputChange}
            />
          </label>
          <br />
          <label>
            Product Price:
            <input
              type="number"
              name="price"
              value={productData.price}
              onChange={handleInputChange}
            />
          </label>
          <br />
          <label>
            Product Image:
            <input type="file" name="image" onChange={handleImageChange} />
          </label>
          <br />
          <button type="submit">
            {isEditing ? 'Update Product' : 'Upload Product'}
          </button>
        </form>
      </div>
      <div>
        <h1>View Products</h1>
        <div>
          <ul>
            {products.map((product) => (
              <li key={product._id}>
                <strong>{product.name}</strong> - {product.description} - ${product.price}
                {product.imagePath && (
                  <div>
                    <img
                      src={`http://localhost:3000/uploads/${product.imagePath}`}
                      alt={product.name}
                    />
                  </div>
                )}
                <div>
                  <button onClick={() => handleEdit(product._id)}>
                    Update 
                  </button>
                  <button onClick={() => handleDelete(product._id)}>Delete</button>
                </div>
                <div>
                  <button onClick={()=>handleDownload(product._id)}>
                    Download
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProductUploader;
