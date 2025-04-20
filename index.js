const express = require('express');
const cors = require('cors');
const { getDirections } = require('./services/getDirections');
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/getDirections', async(req, res) => {
  let directions = await getDirections();
  res.json({ 
    mensaje: '¡Hola desde el backend!',
    distance: directions.distance, 
    duration: directions.duration 
  });
});


app.post('/api/getDirections2', async function(req, res){
  //console.log(request.body);      // your JSON
  //response.send(request.body);    // echo the result back

  let directions = await getDirections(req.body);
  res.send({
    distance: directions.distance, 
    duration: directions.duration 
  });
});

app.listen(PORT, () => {
  console.log(`Backend corriendo en http://localhost:${PORT}`);
});