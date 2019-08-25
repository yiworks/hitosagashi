<template>
  <div class="camera">
    <h1>This is an camera page</h1>
    <button v-on:click="startVideoStream">startVideoStream</button>
    <button v-on:click="frameShooting">frameShooting</button>
    <button v-on:click="apiTest">apiTest</button>
    <button v-on:click="createCollection">createCollection</button>
    <video id="video" autoplay playsinline="true"></video>
    <canvas id="canvas"></canvas>
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
    frameShooting: function() {
      var video = document.getElementById('video')
      var canvas = document.getElementById('canvas')
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
      var s3 = new AWS.S3()
      var bucketName
      canvas.toBlob(function(blob) {

      })
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
    }
  }
}
</script>
