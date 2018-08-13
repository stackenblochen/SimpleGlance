import * as messaging from "messaging";
import document from "document";
import { charger, battery } from "power";
import { inbox } from "file-transfer";
import fs from "fs";
import * as fs from "fs";
import { vibration } from "haptics";
import clock from "clock";
import { display } from "display";

let totalSeconds = 0;
let timeFormat = false;
let displayAlwaysOn = false;

let lowColor = "#e2574c";
let highColor = "fb-yellow";
let inRangeColor = "fb-mint";
let inactiveColor = "fb-light-gray";

let bgUpdateInterval = 300000;
let timeUpdateInterval = 5000;

let showAlertModal = true;

let timeOut;
// Init 
setDate()
setBattery()

// clock
let myClock = document.getElementById("time");
clock.granularity = 'minutes'; // seconds, minutes, hours
clock.ontick = function(evt) {
  myClock.text = ("0" + evt.date.getHours()).slice(-2) + ":" +
                 ("0" + evt.date.getMinutes()).slice(-2)
};


//document.getElementById("iob").style.fill = inactiveColor;
//document.getElementById("cob").style.fill = inactiveColor;

/*
document.getElementById("iob").style.display = "none";
document.getElementById("iob-unit").style.display = "none";
document.getElementById("cob").style.display = "none";
document.getElementById("cob-unit").style.display = "none";
document.getElementById("trenner").style.display = "none";
*/

let requestBtn = document.getElementById("requestBtn");
requestBtn.onactivate = function(evt) {
  console.log("CLICKED!");
  fetchCompaionData();
}



// The updater is used to update the screen every 1 SECONDS 
function updater() {
  setBattery()
  addSecond()
}
setInterval(updater, timeUpdateInterval);

// The fiveMinUpdater is used to update the screen every 5 MINUTES 
function fiveMinUpdater() {
  fetchCompaionData();
}

function setTime() {
}

function checkIobCobVisibility (data) {
  
  var iob = data.iob;
  var cob = data.cob;
  var iobText = document.getElementById("iob");
  var iobUnit = document.getElementById("iob-unit");
  var cobText = document.getElementById("cob");
  var cobUnit = document.getElementById("cob-unit");
  var divider = document.getElementById("divider-cob");
  console.log ("checkIobCobVisibility");
  
  if (!iob) {
    iobText.text = "";
    iobUnit.text = "";
    console.log ("iob=null");
  } else {
    iobText.text = iob;
    iobUnit.text = "IoB"
    console.log ("iob="+iob);
  }
  if (!cob) {
    cobText.text = "";
    cobUnit.text = "";
    divider.text = "";
    console.log ("cob=null");
  } else {
    cobText.text = cob;
    cobUnit.text = "CoB";
    console.log ("cob="+cob);
  }
  if (!iob && cob) {
    divider.text = "";
  }
  if (iob && cob) {
    divider.text = "/";
    iobUnit.text = "I";
    cobUnit.text = "C";
    iobText.text=iob.toFixed(1);
    cobText.text=cob.toFixed(0);
  }
}

function setDate() { 
  let dateObj = new Date();
  let month = ('0' + (dateObj.getMonth() + 1)).slice(-2);
  
  var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  let monthName = months[dateObj.getMonth()];
  let date = dateObj.getDate();
  let day = days [dateObj.getDay()];
  console.log("monthName = ".monthName);
  console.log("day = ".day);
  
  let fullDate = day + ", " + monthName + " " + date;
  let fullDate_noMonths = day + " " + date;
  document.getElementById("fullDate").text = fullDate;
  
}

function setBattery() {
  document.getElementById("battery").text = (Math.floor(battery.chargeLevel) + "%");
}


//minutes sense last pull 
function addSecond() {
  totalSeconds += 5;
  // document.getElementById("seconds").text = pad(totalSeconds % 60);
  document.getElementById("minutes").text = parseInt(totalSeconds / 60) + 'm';
  document.getElementById("divider-minutes").text = "/";
}


// converts a mg/dL to mmoL
function mmol( bg , roundToHundredths) {
  if(roundToHundredths) {
    let mmolBG = Math.round( (bg / 18.1) * 100 ) / 100;
    
  } else {
    let mmolBG = Math.round( (bg / 18.1) * 10 ) / 10;
  }
  return mmolBG;
}

// converts mmoL to  mg/dL 
function  mgdl( bg ) {
    let mgdlBG = Math.round( (bg * 18) / 10 ) * 10;
  return mgdlBG;
}


// set the image of the status image 
/*function setStatusImage(status) {
    //document.getElementById("status-image").href = "img/" + status
}*/
function setDirectionImage(status) 
{
  document.getElementById("direction-image").href = "img/arrows/" + status + ".png";
  if (status == "DoubleUp" || status == "DoubleDown") {
    document.getElementById("direction-image").width = 88;
  } else {
    document.getElementById("direction-image").width = 48;
  }
  console.log(status);
}

function getNumber(theNumber)
{
    if(theNumber > 0){
        return "+" + theNumber;
    }else{
        return theNumber.toString().replace("-", "–");
    }
}

function setBgColor (bg, high, low) {
  var bgText = document.getElementById("bg");
  
  // High
  if (bg > high) {
    document.getElementById("bg").style.fill=highColor;
  }
  
  // Low
  else if (bg < low) {
    document.getElementById("bg").style.fill=lowColor;
  } 
  
  // in Range
  else if (bg > low && bg < high) {
    document.getElementById("bg").style.fill=inRangeColor;
  }
};
//----------------------------------------------------------
//
// This section deals with getting data from the compaion app 
//
//----------------------------------------------------------
// Request data from the companion
function fetchCompaionData(cmd) {
  document.getElementById("bg").style.fill = inactiveColor;
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    // Send a command to the companion
    messaging.peerSocket.send({
      command: cmd
    });
  }
}



// Display the  data received from the companion
function processOneBg(data) {
  console.log("bg is: " + JSON.stringify(data));
  // Temp fix for Spike endpoint 
  // Next pull does not get caculated right
   if(data.nextPull === null) {
    //data.nextPull = 300000
    data.nextPull = bgUpdateInterval
   }
  
  
  if(data.nextPull) {
    
    if(data.units_hint === 'mmol') {
      data.sgv = mmol( data.sgv ) 
      data.delta = mmol( data.delta, true ) 
    }
    document.getElementById("bg").text = data.sgv
    setDirectionImage(data.direction);
    document.getElementById("delta").text = getNumber(data.delta);
    /*if (!data.iob) {
          data.iob = 0;
          document.getElementById("iob").style.fill = inactiveColor;
    } else {
      document.getElementById("iob").style.fill = "white";
    }*/
    //checkIobVisibility (data.iob);
    
    /*if (!data.cob) {
          data.cob = 0;
          document.getElementById("cob").style.fill = inactiveColor;
    } else {
      document.getElementById("cob").style.fill = "white";
    }*/
    //checkCobVisibility (data.iob);
    
    checkIobCobVisibility(data);
    
    //document.getElementById("iob").text = data.iob.toFixed(1);
    //document.getElementById("cob").text = data.cob.toFixed(0);
    
    totalSeconds = 0;
    clearTimeout(timeOut);
    timeOut = setTimeout(fiveMinUpdater, data.nextPull) 
   
  } else {
    //document.getElementById("bg").text = '???'
    document.getElementById("delta").text = 'no data'
    document.getElementById("bg").style.fill = inactiveColor;
    // call function every 10 or 15 mins to check again and see if the data is there   
    setTimeout(fiveMinUpdater, bgUpdateInterval)    
  }
}

// Listen for the onopen event
messaging.peerSocket.onopen = function() {
  fetchCompaionData();
}


// Event occurs when new file(s) are received
inbox.onnewfile = () => {
  let fileName;
  do {
    // If there is a file, move it from staging into the application folder
    fileName = inbox.nextFile();
    if (fileName) {
     
      const data = fs.readFileSync('file.txt', 'cbor');  
      const CONST_COUNT = data.BGD.length - 1;
      let count = CONST_COUNT;
      
      // High || Low alert  
       // data.BGD[count].sgv = 50
       // data.BGD[count].delta = -4
      let sgv = data.BGD[count].sgv;
      
      if( data.BGD[CONST_COUNT].units_hint == 'mmol' ){
        sgv = mmol(sgv)
      }
      
      if(!(data.settings.disableAlert)) {
        if( sgv >= data.settings.highThreshold) {
          if((data.BGD[count].delta > 0)){
            console.log('BG HIGH') 
            startVibration("nudge", 3000, sgv)
          } else {
            console.log('BG still HIGH, But you are going down') 
            showAlertModal = true;
          }
        }

        if(sgv <= data.settings.lowThreshold) {
           if((data.BGD[count].delta < 0)){
              console.log('BG LOW') 
              startVibration("nudge", 3000, sgv)
             } else {
            console.log('BG still LOW, But you are going UP') 
            showAlertModal = true;
          }
        }
      }
      //End High || Low alert      
    
      processOneBg(data.BGD[count])
      
      
      timeFormat = data.settings.timeFormat
      let highThreshold = data.settings.highThreshold
      let lowThreshold =  data.settings.lowThreshold
      
      setBgColor (sgv, highThreshold, lowThreshold);
      

      if(data.BGD[count].units_hint === "mmol") {
        highThreshold = mgdl( data.settings.highThreshold )
        lowThreshold = mgdl( data.settings.lowThreshold )
      }
   //   settings(data.settings, data.BGD[count].units_hint)

      
      // Added by NiVZ    
      /*let ymin = 999;
      let ymax = 0;
      
      data.BGD.forEach(function(bg, index) {
        if (bg.sgv < ymin) { ymin = bg.sgv; }
        if (bg.sgv > ymax) { ymax = bg.sgv; }
      })
      
      ymin -=20;
      ymax +=20;
      
      ymin = Math.floor((ymin/10))*10;
      ymax = Math.floor(((ymax+9)/10))*10;
            
      ymin = ymin < 40 ? ymin : 40;
      ymax = ymax < 210 ? 210 : ymax;
      */
      
      //If mmol is requested format
      if( data.BGD[CONST_COUNT].units_hint == 'mmol' ){
        
        high.text = mmol(ymax);
        middle.text = mmol(Math.floor(ymin + ((ymax-ymin) *0.5)));
        low.text = mmol(ymin = ymin < 0 ? 0 : ymin);
        data.BGD[CONST_COUNT].sgv = mgdl(data.BGD[CONST_COUNT].sgv)
      }
      
      
      //processWeatherData(data.weather)
      //setDate(data.settings.dateFormat) 
      
      //set clock color:
      console.log('set clock color ' + JSON.stringify( data.settings.clockColor))
      
      if (data.settings.clockColor) 
      {
        document.getElementById("time").style.fill = data.settings.clockColor
      }

    }
  } while (fileName);
};

//----------------------------------------------------------
//
// Settings
//
//----------------------------------------------------------
function settings(settings, unitsHint){   

  
 // console.log(settings.disableAlert)
  //   //document.getElementById("high").y = returnPoint(highThreshold)
  //   document.getElementById("high").text = settings.highThreshold

  //   //document.getElementById("middle").y = (returnPoint(highThreshold) + returnPoint(lowThreshold)) / 2
  //   document.getElementById("middle").text = ( parseInt(settings.highThreshold) + parseInt(settings.lowThreshold ))/2

  //   //document.getElementById("low").y =  returnPoint(lowThreshold)
  //   document.getElementById("low").text = settings.lowThreshold
}



//----------------------------------------------------------
//
// Deals with Vibrations 
//
//----------------------------------------------------------
let vibrationTimeout; 

function startVibration(type, length, message) {
  if(showAlertModal){
    showAlert(message) 
    vibration.start(type);
    if(length){
       vibrationTimeout = setTimeout(function(){ startVibration(type, length, message) }, length);
    }
  }
  
}

function stopVibration() {
  vibration.stop();
  clearTimeout(vibrationTimeout);
}
//----------------------------------------------------------
//
// Alerts
//
//----------------------------------------------------------
let myPopup = document.getElementById("popup");
let btnMute = myPopup.getElementById("btn-mute");
//let btnRight = myPopup.getElementById("btnRight");
let alertHeader = myPopup.getElementById("alertHeader");


function showAlert(message) {
  console.log('ALERT BG')
  console.log(message) 
  alertHeader.text = message
  myPopup.style.display = "inline";
}

btnMute.onclick = function(evt) {
  console.log("Mute");
  // TODO This needs to mute it for 15 mins
  myPopup.style.display = "none";
  stopVibration()
   showAlertModal = false;
}



//----------------------------------------------------------
//
// Action listeners 
//
//----------------------------------------------------------

/*document.getElementById("status-image").onclick = (e) => {
  fiveMinUpdater()
}*/
 
// document.getElementById("alertBtn").onclick = (e) => {
//   stopVibration()
// }


