<template>
  <div class="camera">
    <h1>This is a hitosagashi</h1>
    <input type="file" @change="onFileChange">
    <div class="preview-image">
      <img
        v-show="uploadedImage"
        class=""
        :src="uploadedImage"
        alt=""
       />
    </div>
    <p>Collection ID: {{ collectionId }}</p>
    <button v-on:click="consoleLog">consoleLog</button>
    <button v-on:click="startVideoStream">startVideoStream</button>
    <button v-on:click="startVideoStream2">startVideoStream2</button>
    <button v-on:click="frameShooting">frameShooting</button>
    <button v-on:click="apiTest">apiTest</button>
    <button v-on:click="createCollection">createCollection</button>
    <button v-on:click="indexFaces">indexFaces</button>
    <button v-on:click="sendToS3">sendToS3</button>
    <button v-on:click="sendToRekognition">sendToRekognition</button>
    <video id="video" autoplay playsinline="true"></video>
    <canvas id="canvas"></canvas>
    <canvas id="frameshot"></canvas>
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
  data() {
    return {
      collectionId: 0,
      uploadedImage: ''
    }
  },

  methods: {
    idCountUp: function() {
      this.id ++
    },
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

      var count = 0

      var BoundingBox = {
        Height: Math.random(),
        Left: Math.random(),
        Top: Math.random(),
        Width: Math.random()
      }

      let faceBoundingBox = {}

      video.onloadedmetadata = () => {
        video.play()
        canvas.width = offscreenCanvas.width = video.videoWidth
        canvas.height = offscreenCanvas.height = video.videoHeight
        

        tick()
      }

      let faceSearch = async() => {
        var base64 = canvas.toDataURL('image/jpeg')
        var rekognition = new AWS.Rekognition()
        var collectionId = "myphotos"
        var buf = this.base64ToBinary(base64)
        var params = {
          CollectionId: "myphotos",
          Image: {
            Bytes: buf
          }
        }
        
        const searchFacesByImage = () => new Promise((resolve, reject) => {
          rekognition.searchFacesByImage(params, function(err, data) {
            if(err) {
              console.log(err, err.stack)
              reject(err)
            } else {
              console.log(data)
              resolve(data)
            }
          })
        })
        
        return searchFacesByImage().then((res => {
          return res
        }))

        // function base64ToBinary(canvas) {
        //   var base64 = canvas.toDataURL('image/jpeg')
        //   var bin = atob(base64.replace(/^.*,/, ''))
        //   var buffer = new Uint8Array(bin.length)
        //   for (var i = 0; i < bin.length; i++) {
        //     buffer[i] = bin.charCodeAt(i)
        //   }
        //   return buffer
        // }
      }
      function tick() {
        count ++
        offscreenCtx.drawImage(video, 0, 0)        
        const image = offscreenCtx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height)
        // filter(image.data)
        offscreenCtx.putImageData(image, 0, 0)
        ctx.drawImage(offscreenCanvas, 0, 0)

        if(count % 30 === 0 && count <= 300){
          faceSearch().then(result => {
            faceBoundingBox = {
              Height: result.SearchedFaceBoundingBox.Height,
              Left: result.SearchedFaceBoundingBox.Left,
              Top: result.SearchedFaceBoundingBox.Top,
              Width: result.SearchedFaceBoundingBox.Height
            } 
          })
        }

        if(Object.keys(faceBoundingBox).length){
          ctx.lineWidth = 2
          ctx.strokeStyle = 'red'
          ctx.beginPath()
          ctx.rect(faceBoundingBox.Left * canvas.width,
            faceBoundingBox.Top * canvas.height,
            faceBoundingBox.Width * canvas.width,
            faceBoundingBox.Height * canvas.height,
          )
          ctx.stroke()
        }
                
        console.log(count)
        window.requestAnimationFrame(tick)
      }
    },
  
    frameShooting: function() {
      var video = document.getElementById('video')
      var canvas = document.getElementById('frameshot')
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
      // var collectionId = "myphotos"
      var buf = this.base64ToBinary(base64)
      var params = {
        CollectionId: this.collectionId,
        Image: {
          Bytes: buf
        }
      }
      rekognition.searchFacesByImage(params, function(err, data) {
        if(err) console.log(err, err.stack)
        else console.log(data) 
      })
      // function base64ToBinary(canvas) {
      //   var base64 = canvas.toDataURL('image/jpeg')
      //   var bin = atob(base64.replace(/^.*,/, ''))
      //   var buffer = new Uint8Array(bin.length)
      //   for (var i = 0; i < bin.length; i++) {
      //     buffer[i] = bin.charCodeAt(i)
      //   }
      //   return buffer
      // }
    },

    base64ToBinary: function(base64) {
      console.log(base64)
      var bin = atob(base64.replace(/^.*,/, ''))
      var buffer = new Uint8Array(bin.length)
      for (var i = 0; i < bin.length; i++) {
        buffer[i] = bin.charCodeAt(i)
      }
      return buffer
    },

    rekognition: function() {
      //WIP
      var rekognition = new AWS.Rekognition() 
    },
    createCollection: function() {
      const DateTimeStr = () => {
        let date = new Date()
        let year = date.getFullYear().toString()
        let month = ('0' + (date.getMonth())).slice(-2)
        let day = ('0' + (date.getDay())).slice(-2)
        let hours = ('0' + (date.getHours())).slice(-2)
        let minutes = ('0' + (date.getMinutes())).slice(-2)
        let seconds = ('0' + (date.getSeconds())).slice(-2)

        return year + month + day + hours + minutes + seconds
      }
      this.collectionId = DateTimeStr()
      var params = {
        CollectionId: this.collectionId
      }
      var rekognition = new AWS.Rekognition()

      rekognition.createCollection(params, function(err, data) {
        if(err) console.log(err, err.stack)
        else console.log(data)
      })
    },
    indexFaces: function() {
      // var canvas = document.getElementById('canvas')
      var buf = this.base64ToBinary(this.uploadedImage)
      var params = {
        Image: {
          Bytes: buf
        },
        CollectionId: this.collectionId.toString(),
        MaxFaces: 1,
      }
      var rekognition = new AWS.Rekognition()

      rekognition.indexFaces(params, function(err, data) {
        if(err) console.log(err, err.stack)
        else console.log(data)
      })
    },

    onFileChange: function(e) {
      const files = e.target.files || e.dataTransfer.files
      this.createImage(files[0])
      this.img_name = files[0].name
    },

    createImage: function(file) {
      const reader = new FileReader()
      reader.onload = e => {
        this.uploadedImage = e.target.result
      }
      reader.readAsDataURL(file)
    },

    consoleLog: function() {
      console.log(typeof(this.uploadedImage))
    },
  }
}
</script>
