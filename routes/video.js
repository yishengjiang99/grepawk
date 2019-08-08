var express = require('express');
var router = express.Router();
const ytdl = require('ytdl-core')
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const FFmpeg = require('fluent-ffmpeg');
const { PassThrough } = require('stream')

FFmpeg.setFfmpegPath(ffmpegPath);


router.get("/listen", function (req, res) {
  const id = req.query.id || "kFpAh7d7JG0";
  const video = ytdl(id, {
    audioFormat: 'mp3',
    quality: 'lowest',
    filter(format) {
      return format.container === "mp4" && format.audioEncoding
    }
  });
  
  const ffmpeg = new FFmpeg(video);
  process.nextTick(() => {
    const output = ffmpeg.format('mp3').pipe(new PassThrough()).pipe(res);
    ffmpeg.on('err', err => {
      console.log(err);
    })
    output.on('data', data => {
      console.log("*");
    })
  })
})

function getVideoInfo(videoId){
  return new Promise((resolve,reject)=>{
    ytdl(videoId,(err,result)=>{
      if(err) reject(err);
      else{
        resolve(result.player_response.videoDetails.title);
      }
    });
  });
}

router.get("/dl_audio", async function (req, res) {
  const id = req.query.id || "kFpAh7d7JG0";
  const title=await getVideoInfo(id);
  const video = ytdl(id, {
    audioFormat: 'mp3',
    quality: 'lowest',
    filter(format) {
      return format.container === "mp4" && format.audioEncoding
    }
  });

  const ffmpeg = new FFmpeg(video);
  res.setHeader('Content-disposition', 'attachment; filename='+title+'.mp3');
  process.nextTick(() => {
    const output = ffmpeg.format('mp3').pipe(new PassThrough()).pipe(res);
    ffmpeg.on('err', err => {
      console.log(err);
    })
    output.on('data', data => {
      console.log("*");
    })
  })
})

module.exports = router;
