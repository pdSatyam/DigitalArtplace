pragma solidity ^0.4.13;

contract DigitalArtStore {
 enum ProductStatus {Sold, Unsold }

 uint public productIndex;
 mapping (address => mapping(uint => Product)) stores;
 mapping (uint => address) productIdInStore;

 struct Product {
  uint id;
  string name;
  string category;
  string imageLink;
  string descLink;
  uint startPrice;
  ProductStatus status;
 }

 constructor() public {
  productIndex = 0;
 }

 function addProductToStore(string _name, string _category, string _imageLink, string _descLink,uint _startPrice) public {
  productIndex += 1;
  Product memory product = Product(productIndex, _name, _category, _imageLink, _descLink,_startPrice, ProductStatus.Unsold);
  stores[msg.sender][productIndex] = product;
  productIdInStore[productIndex] = msg.sender;
}

function getProduct(uint _productId) view public returns (uint, string, string, string, string, uint, ProductStatus) {
  Product memory product = stores[productIdInStore[_productId]][_productId];
  return (product.id, product.name, product.category, product.imageLink, product.descLink,  product.startPrice, product.status);
}
}
