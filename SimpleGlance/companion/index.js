// Import the messaging module
import * as messaging from "messaging";
import { encode } from 'cbor';
import { outbox } from "file-transfer";
import { settingsStorage } from "settings";
import { me } from "companion";
import { geolocation } from "geolocation";


// // default URL pointing at xDrip Plus endpoint
 var URL = null;
//WeatheyAPI connection
var API_KEY = null;
var ENDPOINT = null

let timeOutInterval = 600000;


// Fetch the weather from OpenWeather
function queryOpenWeather() {
  /*let city = ((getSettings("city")) ? getSettings("city").name : 'charlottesville');
  let searchtext = "select item.condition from weather.forecast where woeid in (select woeid from geo.places(1) where text='" + city + "') and u='"+getTempType()+"'"  
  return fetch("https://query.yahooapis.com/v1/public/yql?q=" + searchtext + "&format=json")
  .then(function (response) {
     return response.json()
      .then(function(data) {
        // We just want the current temperature
        var weather = {
          temperature:data.query.results.channel.item.condition.temp 
        }
        // Send the weather data to the device
        return weather;
      });
  })
  .catch(function (err) {
    console.log("Error fetching weather.You need an API key from openweathermap.org to view weather data. otherwise this error is fine to ignore. " + err);
  });*/
  
}


function queryBGD(unitsHint) {
  let url = getSgvURL()
  console.log(url)
  return fetch(url)
  .then(function (response) {
      return response.json()
      .then(function(data) {
        let date = new Date();
       
        let currentBgDate = new Date(data[0].dateString);
        let diffMs =date.getTime() - JSON.stringify(data[0].date) // milliseconds between now & today              
        if(isNaN(diffMs)) {
           console.log('Not a number set to 5 mins')
           diffMs = 300000
        } else {
          // If the time sense last pull is larger then 15mins send false to display error
          if(diffMs > timeOutInterval ) {
            diffMs = false
          }else {
             if(diffMs > 300000) {
              diffMs = 300000
            } else {
              diffMs = Math.round(300000 - diffMs) + 60000 // add 1 min to account for delay in communications 
            }

          }
        }
        
        let bloodSugars = []
        
        let delta = 0;
        let count = data.length - 1;
        let direction = data[0].direction;
        let iob = data[0].IOB;
        let cob = data[0].COB;
        delta = data[0].sgv - data[1].sgv; 
        data.forEach(function(bg, index){
          let unitType = unitsHint;
          if(unitType == null) {
            unitType = bg.units_hint 
          } else {
            unitType = unitType.values[0].name
          }          
          bloodSugars.push({
             sgv: bg.sgv,
             delta: delta,
             nextPull: diffMs,
             units_hint: unitType,
             direction: direction,
             iob: iob,
             cob: cob
          })
        })   
        // Send the data to the device
        return bloodSugars.reverse();
      });
  })
  .catch(function (err) {
    console.log("Error fetching bloodSugars: " + err);
  });
}


// Send the  data to the device
function returnData(data) {  
  const myFileInfo = encode(data);
  outbox.enqueue('file.txt', myFileInfo)
   
}

function formatReturnData() {
     let weatherPromise = new Promise(function(resolve, reject) {
      resolve( queryOpenWeather() );
    });
    
    let BGDPromise = new Promise(function(resolve, reject) {
      resolve( queryBGD(getSettings("units") ) );
    });
    let highThreshold = null
    let lowThreshold = null
    
    if(getSettings("highThreshold")){
      highThreshold = getSettings("highThreshold").name
    } else {
      highThreshold = 200
    }
  
    if(getSettings("lowThreshold")){
     lowThreshold = getSettings("lowThreshold").name
    } else {
     lowThreshold = 70
    }
        console.log("disableAlert")

      console.log( getSettings('disableAlert'))
    Promise.all([weatherPromise, BGDPromise]).then(function(values) {
      let dataToSend = {
        'weather':values[0],
        'BGD':values[1],
        'settings': {
          'clockColor': getSettings('clockColor'),
          'highThreshold': highThreshold,
          'lowThreshold': lowThreshold,
          'timeFormat': getSettings('timeFormat'),
          'dateFormat': getSettings('dateFormat'),
          'disableAlert': getSettings('disableAlert')
        }
      }
      returnData(dataToSend)
    });
  }


// Listen for messages from the device
messaging.peerSocket.onmessage = function(evt) {
  if (evt.data) {
    formatReturnData()
  }
}




// Listen for the onerror event
messaging.peerSocket.onerror = function(err) {
  // Handle any errors
  console.log("Connection error: " + err.code + " - " + err.message);
}


//----------------------------------------------------------
//
// This section deals with settings
//
//----------------------------------------------------------
settingsStorage.onchange = function(evt) {
 console.log( getSettings(evt.key) )
    formatReturnData()
}

// getters 
function getSettings(key) {
  if(settingsStorage.getItem( key )) {
    return JSON.parse(settingsStorage.getItem( key ));
  } else {
    return undefined
  }
}

function getSgvURL() {
  if(getSettings('endpoint').name) {
    return getSettings('endpoint').name+"?count=2"
  } else {
    // Default Spike App web service 
    return  "http://127.0.0.1:1979/sgv.json"
  }
}

function getTempType() {
   if(getSettings('tempType')){
     return 'f'
   } else {
      return 'c'
   }
}

// TODO make this work Lat and Lon auto detect based on location. 
function locationSuccess(position) {
  return "lat=" + position.coords.latitude + "&lon=" + position.coords.longitude;
}

function locationError(error) {
  console.log("Error: " + error.code,
              "Message: " + error.message);
}

