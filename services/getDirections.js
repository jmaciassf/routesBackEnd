require('dotenv').config()

/*
Bridge, paths: Monterrey - Houston, Monterrey - Dallas
{
    place_id: 'ChIJX_GqeisiYYYRsTJLRTR7jb0',
    position: { lat: 27.5004734, lng: -99.5027081 },
    text: 'Juarez-Lincoln International Bridge, Juárez–Lincoln International Bridge, Laredo, TX 78040'
} */

const apiKey = process.env.GOOGLEMAPS_API_KEY;
async function getDirections(_markers) {
    console.log("getDirections");
    console.log(_markers);

    // Start lambda
    if(_markers.length == 2){

        let splitted = false;
        let bridge = {};

        // Verify origin
        let origin = _markers[0].text, destination = _markers[1].text;
        if(isMonterrey(origin)){
            
            if( isHouston(destination) || isDallas(destination) ){
                splitted = true;
                console.log("splitted true");

                // Split direction: Mty - Juarez-Lincoln International Bridge, Juarez-Lincoln International Bridge - [Houston | Dallas]
                bridge = {
                    name: "Juarez-Lincoln International Bridge",
                    id: 'ChIJX_GqeisiYYYRsTJLRTR7jb0'
                }

                return splitPromise01();
            }
            else if( isBrimingham(destination) ){
                splitted = true;

                let arrDestinations = [{
                    name: _markers[0].text,
                    id: _markers[0].place_id
                }];

                // Mty - Juarez-Lincoln Bridge                
                arrDestinations.push({
                    name: "Juarez-Lincoln International Bridge",
                    id: 'ChIJX_GqeisiYYYRsTJLRTR7jb0'
                });

                // Bridge - Louisiana 
                arrDestinations.push({
                    name: 'Louisiana', // Louisiana State Line
                    id: 'ChIJEyD-AwD_O4YRol53pzYG-iE'
                });

                return splitPromiseArray(arrDestinations);

                // Louisiana - Mississippi
                arrDestinations.push({
                    name: 'Mississippi', // 70264 Atlas Rd, Pearl River, LA 70452, USA
                    id: 'ChIJG-1e-AnqnYgRZ9qrAafvd6s'
                });

                // Mississippi - Alabama
                arrDestinations.push({
                    name: 'Alabama',
                    id: 'ChIJoUzv7u5bhIgRNyN7-4seeYE'
                });

                // Alabama - Brimingham
                arrDestinations.push({
                    name: _markers[1].text,
                    id: _markers[1].place_id
                });

                //return splitPromiseArray(arrDestinations);
            }
        }
        else if(isRamosArizpe(origin)){
            if(isHouston(destination)){
                splitted = true;
                
                // Split direction: Ramos Arizpe Coahuila - Juarez-Lincoln International Bridge, Juarez-Lincoln International Bridge - [Houston]
                bridge = {
                    name: "Juarez-Lincoln International Bridge",
                    id: 'ChIJX_GqeisiYYYRsTJLRTR7jb0'
                }

                return splitPromise01();
            }
        }

        if(!splitted){            
            console.log("splitted false");
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
                        if(distance == "1 ft")
                            distance  = "0 millas";

                        let duration = elements.duration.text.replace("day", "día").replace("hour", "hora").replace("min", "minuto");
                        let price = getPrice(_markers);

                        let result = {
                            distance: distance,
                            duration: duration,
                            price: price
                        }
                        console.log(result);

                        resolve(result);
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

        function splitPromise01(){
            return new Promise((resolve) => {
                // Distance 01 
                distancematrix({
                    origin_id: _markers[0].place_id,
                    destination_id: bridge.id,
                    markers: [{ text: origin }, { text: bridge.name }],
                    callback: function(result){
                        console.log("callback 01");
                        result.origin = origin;
                        result.destination = bridge.name;
                        result.pricePerMile = 0; // Precio fijo
                        console.log(result);

                        // Distance 02 
                        distancematrix({
                            origin_id: bridge.id,
                            destination_id: _markers[1].place_id,
                            markers: [{ text: bridge.name }, { text: destination }],
                            callback: function(result02){
                                console.log("callback 02");
                                result02.origin = bridge.name;
                                result02.destination = destination;
                                result02.pricePerMile = 5.5;

                                if(result02.price == 0){
                                    result02.price = result02.pricePerMile * result02.distance_miles;
                                }

                                console.log(result02);

                                let jResolve = {
                                    breakdown: [result, result02],
                                    distance_meters: result.distance_meters + result02.distance_meters,
                                    distance_miles: result.distance_miles + result02.distance_miles,
                                    duration_seconds: result.duration_seconds + result02.duration_seconds,
                                    price: result.price + result02.price
                                }

                                // Add price Mty-bridge and bridge-Houston with calculation
                                resolve(jResolve);
                            }
                        });
                    }
                });
            });
        }

        function splitPromiseArray(arrDestinations){
            console.log("splitPromiseArray");

            return new Promise((resolve) => {
                let jResolve = {
                    testing: "asdf",
                    breakdown: []
                }

                let index = 0;
                _next();

                function _next(){
                    console.log("index: "+index);

                    if(index+1 < arrDestinations.length){

                        let originName = arrDestinations[index].name, destinationName = arrDestinations[index+1].name;
                        distancematrix({
                            origin_id: arrDestinations[index].id,
                            destination_id: arrDestinations[index+1].id,
                            markers: [{ text: originName }, { text: destinationName }],
                            callback: function(result){
                                console.log("callback " + index);
                                result.origin = originName;
                                result.destination = destinationName;
                                //result.pricePerMile = 0; // Precio fijo
                                console.log(result);
                                jResolve.breakdown.push(result);

                                // Send result
                                if(index+1 == arrDestinations.length-1){
                                    resolve(jResolve);
                                }
                                else {
                                    index++;
                                    _next();
                                }
                            }
                        });
                    }
                }
            });
        }
    }
    // End lambda
}

async function distancematrix(jData){
    let url =
        "https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial"+
        "&origins=place_id:"+jData.origin_id+
        "&destinations=place_id:"+jData.destination_id+
        "&key="+apiKey;

    new Promise((resolve) => {
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

                let distance_miles = Math.ceil(_distance.value / 1609);
                let distance = distance_miles + " millas";

                let duration = elements.duration.text.replace("day", "día").replace("hour", "hora").replace("min", "minuto");
                let price = getPrice(jData.markers);

                let result = {
                    distance: distance,
                    distance_meters: _distance.value,
                    distance_miles: distance_miles,
                    duration: duration,
                    duration_seconds: elements.duration.value,
                    price: price
                }
                console.log(result);

                jData.callback(result);
            }
            else {
                jData.callback({ mensaje: "Error al consultar el API." });
            }
        })
        .catch(err => {
            console.log(err);
            jData.callback({ mensaje: err });
        });    
    });
}

function getPrice(markers){
    console.log("getPrice");
    console.log(markers);
    let origin = markers[0].text, destination = markers[1].text;
    if(origin.includes("Nuevo Laredo") && (origin.includes("Tamaulipas") || origin.includes("Tamps.")) ){ 
        if(isDallas(destination)){
            return 2450;
        }    
    }
    else if(origin.includes("Monterrey")){ 
        if(isDallas(destination)){
            return 3350;
        }
        else if(isHouston(destination)){
            return 2400;
        }
        else if(isBridgeJuarezLincoln(destination)){
            return 464;
        }
    } 
    else if(isRamosArizpe(origin)){ 
        if(isHouston(destination)){
            return 2800;
        }
        else if(isBridgeJuarezLincoln(destination)){
            return 864;
        }
    } 
    else if(isHouston(destination)){
        if(origin.includes("San Luis Potosi")){
            return 3500;
        }
        else if(origin.includes("Querétaro, Mexico") || origin.includes("Qro., Mexico")){
            return 3800;
        }
        else if(origin.includes("Guadalajara") && (origin.includes("Jal.,") || origin.includes("Jalisco"))){
            return 3800;
        }
        else if(origin.includes("Mexico City") || origin.includes("CDMX, Mexico")){
            return 3900;
        }
        else if(origin.includes("Celaya, Guanajuato")){
            return 3800;
        }
    }
    else if(isLaredoTX(origin)){
        if( (destination.includes("Toluca") && destination.includes("State of Mexico")) ||
        (destination.includes("Toluca Centro") && destination.includes("Méx., "))){
            return 2100;
        }
        else if( (destination.includes("Tlalnepantla, Méx.,") )){
            return 2000;
        }
    }
    return 0;
}

function isBrimingham(location){
    return location.includes("Birmingham, AL")
}
function isDallas(location){
    return location.includes("Dallas, TX") || location.includes("DFW Airport")
}
function isHouston(location){
    return location.includes("Houston, TX")
}
function isLaredoTX(location){
    return location.includes("Laredo, TX")
}
function isMonterrey(location){
    return location.includes("Monterrey") && location.includes("Nuevo Leon")
}
function isBridgeJuarezLincoln(location){
    return location.includes("Juarez-Lincoln") && location.includes("International Bridge")
}
function isRamosArizpe(location){
    return location.includes("Ramos Arizpe") && location.includes("Coahuila")
}

module.exports = { getDirections };