require('dotenv').config()
const fetch=require("node-fetch");

function get_coordinates(input){
    var url="https://maps.googleapis.com/maps/api/geocode/json?";
    url+=`address=${encodeURIComponent(input)}&key=${process.env.GOOGLE_API_KEY}`
    return new Promise((resolve,reject)=>{
        fetch(url).then(res=>res.json()).then(json=>{
            if(json.status=='OK' && json.results[0]){
                resolve(json.results[0].geometry.location);
            }
        })
    })
}

var weather = async function(location){
    var coords=await get_coordinates(location);
    var coordstr=coords.lat+","+coords.lng
    var url = `https://api.weather.gov/points/${coordstr}/forecast/hourly`;
    return new Promise((resolve,reject)=>{
        fetch(url).then(res=>res.json()).then(json=>{
            console.log(json);
            if(json.properties && json.properties.periods){
                var times=["time"];
                var temps=["temp"];
                json.properties.periods.forEach((p)=>{
                    times.push(new Date(p.startTime).getTime());
                    temps.push(p.temperature);
                })
                resolve([times,temps]);
            }
           
        })
    })
}

async function getTempChart(input){
    var ret=await weather(input);
    return {
        data:{
           // xFormat:"%Y-%m-%d'T'%H:%M:%s",
            x:'time',
            y:'temp',
            columns:ret
        },
        axis:{
            x:{
                type:"timeseries",
                //tick:"%Y-%m-%d %H-%m"
            }
        },
        title:"Temperture in "+input
    }
}

module.exports = {
    getTempChart: getTempChart,
    weather: weather,
    get_coordinates:get_coordinates


}