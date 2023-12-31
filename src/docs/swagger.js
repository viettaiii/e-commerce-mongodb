const components = require("./components");
const paths = require("./paths");
const tags = require("./tags");
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "E-Commerce API",
      version: "1.0.0",
      description: "API Thương mại điện tử",
      contact: {
        name: "Viết Tàii",
        email: "viettaii2003@gmail.com",
      },
    },
    servers: [{ url: "https://viettai-api-ecommerce.vercel.app/api/v1" }],
    paths: paths,
    tags: tags,
    components: components,
  },
  apis: ["./routes/*.js"],
};

module.exports = options;
