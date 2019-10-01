<template>
  <v-container>
    <video id="video" autoplay playsinline></video>
    <!-- <v-row>
      <v-col>
        <v-card class="pb-5">
          <v-card-title>Step1. 探したい人物一人だけが写った写真を選択します</v-card-title>
          <v-card-actions>
            <v-file-input label="写真を選択" filled  prepend-icon="mdi-camera" @change="onFileChange"></v-file-input>
          </v-card-actions>
          <v-img
            :src="uploadedImage"
            v-show="uploadedImage"
            max-height="300"
            contain
          ></v-img>
        </v-card>
      </v-col>
    </v-row>
   <v-row>
     <v-col>
      <v-card>
        <v-card-title>Step2. カメラが起動したら捜索が始まります</v-card-title>
        <v-card-actions>
          <v-btn v-on:click="startAutoMode">再捜索</v-btn>
          <v-btn v-on:click="stopSearch(animationFrameCallbackId)">停止</v-btn>
          <v-btn v-on:click="onStart">START</v-btn>
          <v-btn v-on:click="indexFaces">indexFaces</v-btn>
        </v-card-actions>
        <v-card-text>{{ message }}</v-card-text>
        <video id="video" autoplay playsinline></video>
        <canvas id="canvas"></canvas>
        
      </v-card>
     </v-col>
   </v-row>
   <v-row>
     <v-col>
       <v-card>
         <v-card-title>To Be Continued...</v-card-title>
         <v-card-text>検知した画像をリストにします</v-card-text>
       </v-card>
     </v-col>
   </v-row> -->
  </v-container>
</template>
<script>
import axios from 'axios'
import AWS from 'aws-sdk'
import { callbackify } from 'util';

AWS.config.update({
  accessKeyId: process.env.VUE_APP_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.VUE_APP_AWS_SECRET_ACCESS_KEY,
  region: 'ap-northeast-1'
})

export default {
  data() {
    return {
      collectionId: 0,
      uploadedImage: '',
      animationFrameCallbackId: '',
      faceBoundingBox: {},
      message: '',
    }
  },
  watch: {
    uploadedImage: function() {
      this.startAutoMode()
    }
  },

  methods: {
    onStart: function() {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
        const video = document.getElementById('video')
        video.srcObject = stream;
      })
    },
    startAutoMode: function() {
      let me = this
      const video = document.createElement("video")
      video.setAttribute("playsinline", true)

      const constrains = {
                                  video: {
                                    facingMode: "environment",
                                    frameRate: {
                                      ideal: 15,
                                      max: 30
                                    }
                                  },
                                  audio: false
                              }
      // 処理用Canvas
      const offscreenCanvas = document.createElement("canvas")
      const offscreenCtx = offscreenCanvas.getContext("2d")
      // 表示用Canvas
      const canvas = document.getElementById("canvas")
      const ctx = canvas.getContext("2d")

      let animationFrameCallbackId = 0
      const drawCanvasLoop = ((animationFrameCallbackId) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.beginPath()
        ctx.drawImage(video, 0, 0)
        drawRect()
        animationFrameCallbackId = window.requestAnimationFrame(drawCanvasLoop)
      })
      const drawRect = (() => {
        if(boundingBox.length === 0) return
        ctx.lineWidth = 2
        ctx.strokeStyle = 'red'
        ctx.rect(
          boundingBox.left,
          boundingBox.top,
          boundingBox.width,
          boundingBox.height
        )
        ctx.stroke()
      })

      const compareFaces = async() => {
        const rekognition = new AWS.Rekognition()
        const sourceImage = base64ToBinary(this.uploadedImage)
        const targetImage = base64ToBinary(canvas.toDataURL('image/jpeg'))
        const params = {
          SourceImage: { Bytes: sourceImage },
          TargetImage: { Bytes: targetImage }
        }
        return new Promise((resolve, reject) => {
          rekognition.compareFaces(params, (err, data) => {
            if(err) {
              console.log(err, err.stack)
              reject(err) 
            } else {
              console.log(data)
              resolve(data)
            }
          })
        })
      }

      const base64ToBinary = (base64) => {
       let bin = atob(base64.replace(/^.*,/, ''))
       let buffer = new Uint8Array(bin.length)
       for (var i = 0; i < bin.length; i++) {
         buffer[i] = bin.charCodeAt(i)
       }
       return buffer 
      }

      let sampleRect = {}

      let boundingBox = {}

      const fetchBoundingBox = () => {
        if(intervalCount > 20) return clearInterval(intervalId)
        compareFaces().then((res => {
          if(res.FaceMatches.length) {
              boundingBox = {
                height: res.FaceMatches[0].Face.BoundingBox.Height * canvas.height,
                left: res.FaceMatches[0].Face.BoundingBox.Left * canvas.width,
                top: res.FaceMatches[0].Face.BoundingBox.Top * canvas.height,
                width: res.FaceMatches[0].Face.BoundingBox.Height * canvas.width
              }
              me.message ='見つかりました！'
          } else {
            me.boundingBox = {}
            me.message ='探しています...'
          }
        }))
        intervalCount++
      }

      let intervalCount = 0
      let intervalId = window.setInterval(fetchBoundingBox, 3000)
      window.setInterval(function() {
        sampleRect = randomRect()
        console.log({sampleRect, boundingBox})
      }, 1000)

      const randomRect = (() => {
        const random = ((min, max) => {
          return Math.floor( Math.random() * (max + 1 - min) ) + min
        })
        return {
          left: random(1, 100),
          top: random(1, 100),
          width: random(1, 100),
          height: random(1, 100),
        }
      })

      navigator.mediaDevices.getUserMedia(constrains).then((stream) => {
        const settings = stream.getVideoTracks()[0].getSettings()
        video.srcObject = stream
        video.onloadedmetadata = (() => {
          video.play()
          // canvas.width = video.videoWidth
          // canvas.height = video.videoHeight
          canvas.width = settings.width
          canvas.height = settings.height
          drawCanvasLoop()
        })
      })
    },

    // startAutoMode: async function() {
    //   // if(!this.uploadedImage) return window.alert('画像を選択してください')
    //   // Video
    //   const video = document.createElement("video")
    //   const constrains = {
    //                         video: {
    //                           facingMode: "environment"
    //                         },
    //                         audio: false
    //                      }
    //   const stream = await navigator.mediaDevices.getUserMedia(constrains)
    //   video.srcObject = stream
    //   // 表示用Canvas
    //   const canvas = document.getElementById("canvas")
    //   const ctx = canvas.getContext("2d")
    //   // 処理用Canvas
    //   const offscreenCanvas = document.createElement("canvas")
    //   const offscreenCtx = offscreenCanvas.getContext("2d")

    //   var count = 0

    //   const sourceImage = this.uploadedImage

    //   var BoundingBox = {
    //     Height: Math.random(),
    //     Left: Math.random(),
    //     Top: Math.random(),
    //     Width: Math.random()
    //   }

    //   let faceBoundingBox = {}

    //   var me = this
    //   video.setAttribute("playsinline", true)
    //   video.onloadedmetadata = () => {
    //     video.play()
    //     canvas.width = offscreenCanvas.width = video.videoWidth
    //     canvas.height = offscreenCanvas.height = video.videoHeight
        
    //     let animationFrameCallbackId = this.animationFrameCallbackId
    //     tick()
    //   }

    //   const compareFaces = async(source, target) => {
    //     const rekognition = new AWS.Rekognition()
    //     const sourceImage = this.base64ToBinary(source)
    //     const targetImage = this.base64ToBinary(target)
    //     const params = {
    //       // SimilarityThureshold: 70,
    //       SourceImage: { Bytes: sourceImage },
    //       TargetImage: { Bytes: targetImage }
    //     }
    //     const fetchAPI = () => new Promise((resolve, reject) => {
    //       rekognition.compareFaces(params, (err, data) => {
    //         if(err) {
    //           console.log(err, err.stack)
    //           reject(err) 
    //         } else {
    //           console.log(data)
    //           resolve(data)
    //         }
    //       })
    //     })
    //     return fetchAPI().then((res => {
    //       return res
    //     }))
    //   }
      

    //   const tick = function(animationFrameCallbackId) {
    //     count ++
    //     offscreenCtx.drawImage(video, 0, 0)        
    //     const image = offscreenCtx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height)
    //     offscreenCtx.putImageData(image, 0, 0)
    //     ctx.drawImage(offscreenCanvas, 0, 0)

    //     // if(false) {
    //     if(count % 30 === 0 && count <= 1000) {
    //       const targetImage = offscreenCanvas.toDataURL('image/jpeg')
    //       compareFaces(sourceImage, targetImage).then(result => {
    //         console.log(result)
    //         if(result.FaceMatches.length) {
    //           faceBoundingBox = {
    //             Height: result.FaceMatches[0].Face.BoundingBox.Height,
    //             Left: result.FaceMatches[0].Face.BoundingBox.Left,
    //             Top: result.FaceMatches[0].Face.BoundingBox.Top,
    //             Width: result.FaceMatches[0].Face.BoundingBox.Height
    //           }
    //           me.message ='見つかりました！'
    //         } else {
    //           me.faceBoundingBox = {}
    //           me.message ='探しています...'
    //         }
    //       }).catch(e => {
    //         me.faceBoundingBox = {}
    //         me.message = '探しています...'
    //       })
    //     } else if (count >= 3000) {
    //        me.faceBoundingBox = {}
    //        me.message = '探索を終了します。'
    //        me.stopSearch()
    //     }


    //     if(Object.keys(faceBoundingBox).length){
    //       ctx.lineWidth = 2
    //       ctx.strokeStyle = 'red'
    //       ctx.beginPath()
    //       console.log(faceBoundingBox)
    //       ctx.rect(faceBoundingBox.Left * canvas.width,
    //         faceBoundingBox.Top * canvas.height,
    //         faceBoundingBox.Width * canvas.width,
    //         faceBoundingBox.Height * canvas.height,
    //       )
    //       ctx.stroke()
    //     }
                
    //     me.animationFrameCallbackId = window.requestAnimationFrame(tick)
    //   }
    // },

    stopSearch: function(animationFrameCallbackId) {
      cancelAnimationFrame(animationFrameCallbackId)
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

    },

    base64ToBinary: function(base64) {
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
      const file = e
      this.createImage(file)
      this.img_name = file.name
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
