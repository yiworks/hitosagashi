<template>
  <div class="camera">
    <h1>This is a camera page</h1>
    <button v-on:click="startVideoStream">startVideoStream</button>
    <button v-on:click="startVideoStream2">startVideoStream2</button>
    <button v-on:click="frameShooting">frameShooting</button>
    <button v-on:click="apiTest">apiTest</button>
    <button v-on:click="createCollection">createCollection</button>
    <button v-on:click="indexFaces">indexFaces</button>
    <button v-on:click="sendToS3">sendToS3</button>
    <button v-on:click="sendToRekognition">sendToRekognition</button>
    <video id="video" playsinline="true"></video>
    <canvas id="canvas"></canvas>
    <canvas id="frameshoot"></canvas>
    <img id="img">
  </div>
</template>
<script>
import axios from 'axios'
import AWS from 'aws-sdk'

AWS.config.update({
  accessKeyId: process.env.VUE_APP_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.VUE_APP_AWS_SECRET_ACCESS_KEY,
  region: 'ap-northeast-1'
})

export default {
  methods: {
    startVideoStream: function() {
      var video = document.getElementById('video')
      var constrains = { video: true, audio: false }

      navigator.mediaDevices.getUserMedia(constrains)
        .then((stream) => {
          video.srcObject = stream
        }).catch((err) => {
        window.alert(err.name + ': ' + err.message)
      })
    },
    startVideoStream2: async function() {
      // Video
      const video = document.createElement("video")
      const constrains = { video: true, audio: false }
      const stream = await navigator.mediaDevices.getUserMedia(constrains)
      video.srcObject = stream
      // 表示用Canvas
      const canvas = document.getElementById("canvas")
      const ctx = canvas.getContext("2d")
      // 処理用Canvas
      const offscreenCanvas = document.createElement("canvas")
      const offscreenCtx = offscreenCanvas.getContext("2d")

      video.onloadedmetadata = () => {
        video.play()
        canvas.width = offscreenCanvas.width = video.videoWidth
        canvas.height = offscreenCanvas.height = video.videoHeight

        tick()
      }
      function tick() {
        offscreenCtx.drawImage(video, 0, 0)        
        const image = offscreenCtx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height)
        // filter(image.data)
        offscreenCtx.putImageData(image, 0, 0)
        ctx.drawImage(offscreenCanvas, 0, 0)
        window.requestAnimationFrame(tick)
      }
    },
    frameShooting: function() {
      var video = document.getElementById('video')
      var canvas = document.getElementById('frameshoot')
      var ctx = canvas.getContext('2d')
      var width = video.offsetWidth;
      var height = video.offsetHeight
      canvas.setAttribute('width', width)
      canvas.setAttribute('height', height)
      ctx.drawImage(video, 0, 0, width, height)
      // canvas.toBlob(function(blob) {
      //   var img = document.getElementById('image')
      //   img.src = window.URL.createObjectURL(blob)
      // }, 'image/jpeg', 0.95)
    },
    apiTest: function() {
      axios
        .get('https://api.coindesk.com/v1/bpi/currentprice.json')
        .then(res => (window.alert(res)))
    },
    sendToS3: function() {
      //WIP
      var canvas = document.getElementById('canvas')
      var bucketName = "hitosagashi"
      var fileName = Date.now().toString() + '.jpg'
      var s3 = new AWS.S3({
        params: {
          Bucket: bucketName
        }
      })
      var base64 = canvas.toDataURL('image/jpeg')
      var blob = dataURItoBlob(base64)
      s3.putObject({
        Key: fileName,
        Body: blob
      }, function(err, data) {
        if(err) console.log(err, err.stack)
        else console.log(data)
      })
      // canvas.toBlob(function(blob) {
      //   s3.putObject({
      //   Key: fileName,
      //   Body: blob
      //   }, function(err, data){
      //     if(err) console.log(err, err.stack)
      //     else console.log(data)
      //   })
      // }, 'image/jpeg', 0.95)
      function dataURItoBlob(dataURI) {
        var binary = atob(dataURI.split(',')[1]);
        var array = [];
        for(var i = 0; i < binary.length; i++) {
          array.push(binary.charCodeAt(i));
        }
      return new Blob([new Uint8Array(array)], {type: 'image/jpeg'});
      }
    },
    sendToRekognition: function() {
      var canvas = document.getElementById('canvas')
      var base64 = canvas.toDataURL('image/jpeg')
      var rekognition = new AWS.Rekognition()
      var collectionId = "myphotos"
      var buf = toBinary(canvas)
      var params = {
        CollectionId: "myphotos",
        Image: {
          Bytes: buf
        }
      }
      rekognition.searchFacesByImage(params, function(err, data) {
        if(err) console.log(err, err.stack)
        else console.log(data) 
      })
      function toBinary(canvas) {
        var base64 = canvas.toDataURL('image/jpeg')
        var bin = atob(base64.replace(/^.*,/, ''))
        var buffer = new Uint8Array(bin.length)
        for (var i = 0; i < bin.length; i++) {
          buffer[i] = bin.charCodeAt(i)
        }
        return buffer
      }
    },
    rekognition: function() {
      //WIP
      var rekognition = new AWS.Rekognition() 
    },
    createCollection: function() {
      var params = {
        CollectionId: "myphotos"
      }
      var rekognition = new AWS.Rekognition()

      rekognition.createCollection(params, function(err, data) {
        if(err) console.log(err, err.stack)
        else console.log(data)
      })
    },
    indexFaces: function() {
      var canvas = document.getElementById('canvas')
      
      
      var params = {
        Image: {
          Bytes: imageBytes
        },
        CollectionId: "myphotos",
        MaxFaces: 1,
      }
      var rekognition = new AWS.Rekognition()

      rekognition.indexFaces(params, function(err, data) {
        if(err) console.log(err, err.stack)
        else console.log(data)
      })
    }
  }
}
</script>
