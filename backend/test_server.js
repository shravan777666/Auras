import express from 'express';

const app = express();
const port = 5005;

app.get('/', (req, res) => {
  res.send('Hello from the test server!');
});

app.listen(port, () => {
  console.log(`Test server listening at http://localhost:${port}`);
});
