const http = require('http');
require('dotenv').config()

const app = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' })
  response.end('Hello World')
});

const newLocal = 3001;
const PORT = process.env.PORT || newLocal;
app.listen(PORT, () => {
  console.log("Server running on port "+PORT)
  console.log(process.env.DB_name)
});