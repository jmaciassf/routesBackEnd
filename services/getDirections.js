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
        let origin = _markers[0].text, jDestination = _markers[1], destination = jDestination.text;
        if(isMonterrey(origin)){
            
            bridge = {
                name: "Juarez-Lincoln International Bridge",
                id: 'ChIJX_GqeisiYYYRsTJLRTR7jb0'
            }

            let pricePerMile = 0;
            if( isIndiana(jDestination) || isKentucky(jDestination) || isMichigan(jDestination) || isNewYork(jDestination) || isConnecticut(jDestination) 
                || isPennsylvania(jDestination) || isWestVirginia(jDestination) || isOhio(jDestination) || isCalifornia(jDestination)
                || isDelaware(jDestination) || isMaine(jDestination) || isMaryland(jDestination) || isMassachusetts(jDestination) 
                || isNewHampshire(jDestination) || isNewJersey(jDestination) || isVirginia(jDestination) || isVermont(jDestination)
                || isTennessee(jDestination) || isRhodeIsland(jDestination) ){
                pricePerMile = 3.2;
            }
            else if( isOklahoma(jDestination) || isNorthCarolina(jDestination) ){
                pricePerMile = 3.3;
            }
            else if( isArkansas(jDestination) || isIllinois(jDestination) || isMississippi(jDestination) || isMissouri(jDestination)
                || isSouthCarolina(jDestination) || isWisconsin(jDestination) || isAlabama(jDestination) ){
                pricePerMile = 3.4;
            }                        
            else if( isKansas(jDestination) ){
                pricePerMile = 3.45;
            }                   
            else if( isIowa(jDestination) ){
                pricePerMile = 3.46;
            }            
            else if( isLouisiana(jDestination) || isGeorgia(jDestination) ){
                pricePerMile = 3.5;
            }            
            else if( isFlorida(jDestination) ){
                pricePerMile = 3.75;
            }            
            else if( isNebraska(jDestination) ){
                pricePerMile = 4.5;
            }
            else if( isArizona(jDestination) || isMinnesota(jDestination) || isNorthDakota(jDestination) || isSouthDakota(jDestination) ){
                pricePerMile = 5;
            }
            else if( isNewMexico(jDestination) || isTexas(jDestination) ){
                pricePerMile = 5.5;
            }
            else if( isColorado(jDestination) || isMontana(jDestination) || isWashington(jDestination) || isIdaho(jDestination) 
                || isNevada(jDestination) || isOregon(jDestination) || isWyoming(jDestination) || isUtah(jDestination) ){
                pricePerMile = 6;
            }

            if(pricePerMile){
                return splitPromise01({
                    pricePerMile: pricePerMile
                });
            }
        }
        else if(isRamosArizpe(origin)){
            if(isHouston(destination)){
                
                // Split direction: Ramos Arizpe Coahuila - Juarez-Lincoln International Bridge, Juarez-Lincoln International Bridge - [Houston]
                bridge = {
                    name: "Juarez-Lincoln International Bridge",
                    id: 'ChIJX_GqeisiYYYRsTJLRTR7jb0'
                }

                return splitPromise01({
                    pricePerMile: 5.5
                });
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

        function splitPromise01(jData){
            console.log("splitPromise01");
            if(!jData) jData = {}
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
                                result02.pricePerMile = jData.pricePerMile || 0;

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
                                resolve(jResolve);
                            }
                        });
                    }
                });
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
            return 750;
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

// Locations
function isAlabama(marker){
    return marker.country == "US" && marker.state == "AL";
}
function isArizona(marker){
    return marker.country == "US" && marker.state == "AZ";
}
function isArkansas(marker){
    return marker.country == "US" && marker.state == "AR";
}
function isBridgeJuarezLincoln(location){
    return location.includes("Juarez-Lincoln") && location.includes("International Bridge")
}
function isCalifornia(marker){
    return marker.country == "US" && marker.state == "CA";
}
function isColorado(marker){
    return marker.country == "US" && marker.state == "CO";
}
function isConnecticut(marker){
    return marker.country == "US" && marker.state == "CT";
}
function isDallas(location){
    return location.includes("Dallas, TX") || location.includes("DFW Airport")
}
function isDelaware(marker){
    return marker.country == "US" && marker.state == "DE";
}
function isFlorida(marker){
    return marker.country == "US" && marker.state == "FL";
}
function isGeorgia(marker){
    return marker.country == "US" && marker.state == "GA";
}
function isHouston(location){
    return location.includes("Houston, TX")
}
function isIdaho(marker){
    return marker.country == "US" && marker.state == "ID";
}
function isIllinois(marker){
    return marker.country == "US" && marker.state == "IL";
}
function isIndiana(marker){
    return marker.country == "US" && marker.state == "IN";
}
function isIowa(marker){
    return marker.country == "US" && marker.state == "IA";
}
function isKansas(marker){
    return marker.country == "US" && marker.state == "KS";
}
function isKentucky(marker){
    return marker.country == "US" && marker.state == "KY";
}
function isLaredoTX(location){
    return location.includes("Laredo, TX")
}
function isLouisiana(marker){
    return marker.country == "US" && marker.state == "LA";
}
function isMaine(marker){
    return marker.country == "US" && marker.state == "ME";
}
function isMaryland(marker){
    return marker.country == "US" && marker.state == "MD";
}
function isMassachusetts(marker){
    return marker.country == "US" && marker.state == "MA";
}
function isMichigan(marker){
    return marker.country == "US" && marker.state == "MI";
}
function isMinnesota(marker){
    return marker.country == "US" && marker.state == "MN";
}
function isMississippi(marker){
    return marker.country == "US" && marker.state == "MS";
}
function isMissouri(marker){
    return marker.country == "US" && marker.state == "MO";
}
function isMontana(marker){
    return marker.country == "US" && marker.state == "MT";
}
function isMonterrey(location){
    return location.includes("Monterrey") && location.includes("Nuevo Leon")
}
function isNebraska(marker){
    return marker.country == "US" && marker.state == "NE";
}
function isNevada(marker){
    return marker.country == "US" && marker.state == "NV";
}
function isNewHampshire(marker){
    return marker.country == "US" && marker.state == "NH";
}
function isNewJersey(marker){
    return marker.country == "US" && marker.state == "NJ";
}
function isNewMexico(marker){
    return marker.country == "US" && marker.state == "NM";
}
function isNewYork(marker){
    return marker.country == "US" && marker.state == "NY";
}
function isNorthCarolina(marker){
    return marker.country == "US" && marker.state == "NC";
}
function isNorthDakota(marker){
    return marker.country == "US" && marker.state == "ND";
}
function isOhio(marker){
    return marker.country == "US" && marker.state == "OH";
}
function isOklahoma(marker){
    return marker.country == "US" && marker.state == "OK";
}
function isOregon(marker){
    return marker.country == "US" && marker.state == "OR";
}
function isPennsylvania(marker){
    return marker.country == "US" && marker.state == "PA";
}
function isRhodeIsland(marker){
    return marker.country == "US" && marker.state == "RI";
}
function isSouthCarolina(marker){
    return marker.country == "US" && marker.state == "SC";
}
function isSouthDakota(marker){
    return marker.country == "US" && marker.state == "SD";
}
function isTennessee(marker){
    return marker.country == "US" && marker.state == "TN";
}
function isTexas(marker){
    return marker.country == "US" && marker.state == "TX";
}
function isRamosArizpe(location){
    return location.includes("Ramos Arizpe") && location.includes("Coahuila")
}
function isUtah(marker){
    return marker.country == "US" && marker.state == "UT";
}
function isVermont(marker){
    return marker.country == "US" && marker.state == "VT";
}
function isVirginia(marker){
    return marker.country == "US" && marker.state == "VA";
}
function isWashington(marker){
    return marker.country == "US" && marker.state == "WA";
}
function isWestVirginia(marker){
    return marker.country == "US" && marker.state == "WV";
}
function isWisconsin(marker){
    return marker.country == "US" && marker.state == "WI";
}
function isWyoming(marker){
    return marker.country == "US" && marker.state == "WY";
}


module.exports = { getDirections };