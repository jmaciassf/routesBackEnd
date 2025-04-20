require('dotenv').config()

async function getDirections(_markers) {
    console.log("getDirections");
    console.log(_markers);

    //let _markers = [{"id":1,"place_id":"ChIJRX6YMS_vYoYR1Lg9kQNoM38"}, { id: 2, place_id: "ChIJl9ccRqSTYoYRAoX080KMn0w" }];
    if(_markers.length == 2){
        
        const apiKey = process.env.GOOGLEMAPS_API_KEY;
        let url = 
            "https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial"+
            "&origins=place_id:"+_markers[0].place_id+
            "&destinations=place_id:"+_markers[1].place_id+
            "&key="+apiKey;

        return new Promise((resolve) => {
            fetch(url)
            .then(results => results.json())
            .then(data => {
                console.table(data);
                if(data.rows[0]){
                    let elements = data.rows[0].elements[0];
                    let _distance = elements.distance;
                    console.log("Elements: ");
                    console.log(elements);
                    console.log("Distance: ");
                    console.log(_distance);

                    let distance = _distance.text.replace("mi", "millas");
                    let duration = elements.duration.text.replace("day", "día").replace("hour", "hora").replace("min", "minuto");

                    resolve({ 
                        distance: distance,
                        duration: duration 
                    });
                }
                else {
                    resolve({ mensaje: "Error al consultar el API." });
                }
            })
            .catch(err => {
                console.log(err);
                resolve({ mensaje: err });
            });    
        });
    }
}
  
module.exports = { getDirections };

  
