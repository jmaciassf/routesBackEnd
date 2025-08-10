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
            
            bridge = {
                name: "Juarez-Lincoln International Bridge",
                id: 'ChIJX_GqeisiYYYRsTJLRTR7jb0'
            }

            let pricePerMile = 0;
            if( isIndiana(destination) || isKentucky(destination) || isMichigan(destination) || isNewYork(destination) || 
                isPennsylvania(destination) || isWestVirginia(destination) || isOhio(destination) ){
                pricePerMile = 3.2;
            }
            else if( isOklahoma(destination) ){
                pricePerMile = 3.3;
            }
            else if( isBrimingham(destination) || isMontgomery(destination) || isMobile_AL(destination) || isArkansas(destination) || isIllinois(destination)
                || isSouthCarolina(destination) || isWisconsin(destination) ){
                pricePerMile = 3.4;
            }                        
            else if( isKansas(destination) ){
                pricePerMile = 3.45;
            }
            else if( isLouisiana(destination) || isGeorgia(destination) ){
                pricePerMile = 3.5;
            }            
            else if( isFlorida(destination) ){
                pricePerMile = 3.75;
            }
            else if( isArizona(destination) || isMinnesota(destination) ){
                pricePerMile = 5;
            }
            else if( isDallas(destination) || isNewMexico(destination) || isTexas(destination) ){
                pricePerMile = 5.5;
            }
            else if( isColorado(destination) || isMontana(destination) ){
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

                                // Add price Mty-bridge and bridge-Houston with calculation
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

function searchLocations(location, arr) {
  if (!Array.isArray(arr) || arr.length === 0) return false;
  return arr.some(element => location.includes(element));
}
function isArizona(location){
    return location.includes("Kingman, AZ") || location.includes('Phoenix, AZ') || location.includes('Sahuarita, AZ') || location.includes('Tucson, AZ') || location.includes('Willcox, AZ')
}
function isArkansas(location){
    return location.includes("Fort Smith, AR") || location.includes('Springdale, AR')
}
function isBrimingham(location){
    return location.includes("Birmingham, AL")
}
function isColorado(location){
    return location.includes("Colorado Springs, CO")
}
function isDallas(location){
    return location.includes("Dallas, TX") || location.includes("DFW Airport")
}
function isFlorida(location){
    let _includes = searchLocations(location, [", Fort Myers, FL ", "Bradenton, FL", "Brooksville, FL", "Cape Coral, FL", 'Port Charlotte, FL', 'Clearwater, FL', 'Holly Hill, FL', 
        'Daytona Beach, FL', 'Doral, FL', 'Edgewater, FL', 'Fort Walton Beach, FL', 'Miami Beach, FL', 'Jacksonville, FL', 'Kissimmee, FL', 'Lafayette County, FL']);
    return _includes || location.endsWith(", FL") || location.endsWith(", FL 32750");
}
function isGeorgia(location){
    let _includes = searchLocations(location, ["Buford, GA"]);
    return _includes || location.endsWith(", GA")
}
function isHouston(location){
    return location.includes("Houston, TX")
}
function isIllinois(location){
    let _includes = searchLocations(location, ["Bloomington, IL", " IL 61364", "IL 60545"]);
    return _includes || location.endsWith(", IL")
}
function isIndiana(location){
    let _includes = searchLocations(location, ["Bloomington, IN"]);
    return _includes || location.endsWith(", IN")
}
function isKansas(location){
    let _includes = searchLocations(location, [" KS 67869", " KS 67552"]);
    return _includes; // || location.endsWith(", IN")
}
function isKentucky(location){
    let _includes = searchLocations(location, ["Louisville, KY"]);
    return _includes || location.endsWith(", KY")
}
function isLaredoTX(location){
    return location.includes("Laredo, TX")
}
function isLouisiana(location){
    let _includes = searchLocations(location, ["Baton Rouge, LA", " LA 70123"]);
    return _includes || location.endsWith(", LA")
}
function isMichigan(location){
    let _includes = searchLocations(location, ["Howell, MI"]);
    return _includes || location.endsWith(", MI")
}
function isMinnesota(location){
    let _includes = searchLocations(location, ["Minneapolis, MN"]);
    return _includes || location.endsWith(", MN")
} 
function isMobile_AL(location){
    return location.includes('Mobile, AL')
}
function isMontana(location){
    let _includes = searchLocations(location, ["Missoula, MT"]);
    return _includes || location.endsWith(", MT")
}
function isMonterrey(location){
    return location.includes("Monterrey") && location.includes("Nuevo Leon")
}
function isMontgomery(location){
    return location.includes("Montgomery, AL")
}
function isNewMexico(location){
    let _includes = searchLocations(location, ["Las Cruces, NM"]);
    return _includes || location.endsWith(", NM")
}
function isNewYork(location){
    let _includes = searchLocations(location, ["Liberty, NY"]);
    return _includes || location.endsWith(", NY")
}
function isOhio(location){
    let _includes = searchLocations(location, ["Jeffersonville, OH"]);
    return _includes || location.endsWith(", OH")
}
function isOklahoma(location){
    let _includes = searchLocations(location, ["Oklahoma City, OK"]);
    return _includes || location.endsWith(", OK")
}
function isPennsylvania(location){
    let _includes = searchLocations(location, ["East Earl, PA"]);
    return _includes || location.endsWith(", PA")
}
function isSouthCarolina(location){
    let _includes = searchLocations(location, ["Columbia, SC"]);
    return _includes || location.endsWith(", SC")
}
function isTexas(location){
    let _includes = searchLocations(location, ["Houston, TX", "Austin, TX", " TX 79029", " TX 78852", "TX 78577", "TX 78582", "TX 79360"]);
    return _includes || location.endsWith(", TX")
}
function isBridgeJuarezLincoln(location){
    return location.includes("Juarez-Lincoln") && location.includes("International Bridge")
}
function isRamosArizpe(location){
    return location.includes("Ramos Arizpe") && location.includes("Coahuila")
}
function isWestVirginia(location){
    let _includes = searchLocations(location, ["Martinsburg, WV"]);
    return _includes || location.endsWith(", WV")
}
function isWisconsin(location){
    let _includes = searchLocations(location, ["Iron Ridge, WI 53035"]);
    return _includes || location.endsWith(", WI")
}
 


module.exports = { getDirections };