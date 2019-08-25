<template>
  <div class="camera">
    <h1>This is an camera page</h1>
    <button v-on:click="startVideoStream">startVideoStream</button>
    <button v-on:click="frameShooting">frameShooting</button>
    <button v-on:click="apiTest">apiTest</button>
    <video id="video" autoplay playsinline="true"></video>
    <canvas id="canvas"></canvas>
  </div>
</template>
<script>
import axios from 'axios'
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
    },
    apiTest: function() {
      axios
        .get('https://api.coindesk.com/v1/bpi/currentprice.json')
        .then(res => (window.alert(res)))
    }
  }
}
</script>
