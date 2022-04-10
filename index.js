const express = require("express");
const cors = require("cors");
const http = require("http");
const bodyParser = require("body-parser");
const { uniq } = require("lodash");

const app = express();
const server = http.createServer(app);
const port = 3000;

const initProduct = require("./initProducts.json");

let productList = initProduct.productList;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

app.use(express.static("public"));

const formattedProduct = (product) => ({
  ...product,
  isOut: (product?.reservations?.length || 0) >= product.amount,
});

app.get("/api/products", (req, res) => {
  res.send(productList.map((product) => formattedProduct(product)));
});

app.put("/api/products", (req, res) => {
  const newProductList = req.body;

  if (newProductList) {
    productList = [...newProductList];

    res.send(productList.map((product) => formattedProduct(product)));
  } else {
    res.status(404).send();
  }
});

app.get("/api/products/:id", (req, res) => {
  const product = productList.find(({ id }) => id == req.params.id);

  if (product) {
    res.send(formattedProduct(product));
  } else {
    res.status(404).send();
  }
});

app.put("/api/products/:id", (req, res) => {
  const productIndex = productList.findIndex(({ id }) => id == req.params.id);

  if (productIndex !== -1) {
    const newProduct = Object.assign(productList[productIndex], req.body);

    productList = [
      ...productList.slice(0, productIndex),
      newProduct,
      ...productList.slice(productIndex + 1),
    ];

    res.send(formattedProduct(newProduct));
  } else {
    res.status(404).send();
  }
});

app.post("/api/products/:id/reservation/users/:userId", (req, res) => {
  const userId = req.params.userId;
  const productIndex = productList.findIndex(({ id }) => id == req.params.id);

  if (productIndex !== -1) {
    const product = productList[productIndex];
    const newProduct = Object.assign(product, {
      reservations: uniq([...product.reservations, userId]),
    });

    productList = [
      ...productList.slice(0, productIndex),
      newProduct,
      ...productList.slice(productIndex + 1),
    ];

    res.status(200).send();
  } else {
    res.status(404).send();
  }
});

app.delete("/api/products/:id/reservation/users/:userId", (req, res) => {
  const userId = req.params.userId;
  const productIndex = productList.findIndex(({ id }) => id == req.params.id);

  if (productIndex !== -1) {
    const product = productList[productIndex];
    const newProduct = Object.assign(product, {
      reservations: product.reservations.filter(
        (reservator) => reservator != userId
      ),
    });

    productList = [
      ...productList.slice(0, productIndex),
      newProduct,
      ...productList.slice(productIndex + 1),
    ];

    res.status(200).send();
  } else {
    res.status(404).send();
  }
});

server.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
