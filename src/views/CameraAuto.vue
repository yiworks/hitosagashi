<template>
  <div>
    <v-container>
      <!-- <input id="fileInput" type="file" style="display:none" v-on:change="onFileChange()"/> -->
      <v-row class="photo-selector" v-show="!uploadedImage">
        <v-file-input label="写真を選択" color="deep-purple accent-4" filled prepend-icon="mdi-image" @change="onFileChange"></v-file-input>
      </v-row>
      <v-row>
        <v-img
          :src="uploadedImage"
          v-show="uploadedImage"
          max-width="150"
          contain
          class="image"
        ></v-img>
      </v-row>
      <v-row class="camera">
        <video id="video" autoplay playsinline="true"></video>
        <canvas id="canvas"></canvas>
        <span class="message">{{message}}</span>
      </v-row>
    </v-container>
      
    <v-toolbar
        :absolute="true"
        :bottom="true"
        min-width="100%"
    >
      <v-spacer></v-spacer>
      <v-btn icon v-on:click="download">
        <v-icon>mdi-download</v-icon>
      </v-btn>
      <div class="flex-grow-1"></div>
      <v-btn icon v-on:click="manualSearch">
      <!-- <v-btn icon onclick="document.getElementById('fileInput').click()"> -->
        <v-icon>mdi-camera</v-icon>
      </v-btn>
      <div class="flex-grow-1"></div>
      <v-btn icon v-on:click="clear">
        <v-icon>mdi-refresh</v-icon>
      </v-btn>
      <v-spacer></v-spacer>
    </v-toolbar>
  </div>
</template>
<script>
import axios from 'axios'
import AWS from 'aws-sdk'
import { callbackify } from 'util';
import EXIF from 'exif-js'

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
      boundingBox: {},
      message: '',
      videoSize: {},
      loading: false,
    }
  },
  watch: {
    uploadedImage: function() {
      // this.startAutoMode()
    }
  },
  // video test
  // const video = document.getElementById("video")
  mounted: function () {
    const video = document.getElementById('video')
    const canvas = document.getElementById('canvas')
    const constrains = {
        video: {
          // width: 375,
          // height: 375,
          // height: video.clientHeight,
          // width: 720,
          // height: 1280,
          facingMode: "environment",
          frameRate: {
            ideal: 15,
            max: 30
          }
        },
        audio: false
    }
    
    if(!!navigator.mediaDevices&&!!navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia(constrains).then((stream) => {
        const settings = stream.getVideoTracks()[0].getSettings()
        video.srcObject = stream
        video.onloadedmetadata = (() => {
          video.play()
          console.log('client', video.clientWidth, video.clientHeight)
          console.log('video', video.videoWidth, video.videoHeight)
          console.log('settings', settings.width, settings.height)
          console.log('client', video.clientWidth, video.clientHeight)
          // canvas.width = video.videoWidth
          canvas.height = video.clientHeight
          canvas.width = video.clientWidth
          // canvas.height = 375
        })
      })
    } else {
      return window.alert("非対応機種です。申し訳ございません。")
    }
  },

  methods: {
    manualSearch: function() {
      if (this.uploadedImage === "") return window.alert("写真を選択してください??")
      this.message = "探しています..."
      const video = document.getElementById('video')
      const canvas = document.getElementById("canvas")
      const ctx = canvas.getContext("2d")
      const offscreenCanvas = document.createElement("canvas")
      const offscreenCtx = offscreenCanvas.getContext("2d")
      offscreenCanvas.width = canvas.width
      offscreenCanvas.height = canvas.height
      // window.alert(`offscreenCanvas.width: ${offscreenCanvas.width}, canvas.width: ${canvas.width}, video.videoWidth: ${video.videoWidth}, video.videoHeight: ${video.videoHeight}`)

      const scale = {width: video.clientWidth / video.videoWidth, height: video.clientHeight / video.videoHeight }
      let dstWidth = video.videoWidth * scale.width
      let dstHeight = video.videoHeight * scale.height      

      offscreenCtx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight, 0, 0, dstWidth, dstHeight)
      const image = offscreenCtx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height)

      offscreenCtx.putImageData(image, 0, 0)
      console.log(video.videoWidth, dstWidth)
      ctx.drawImage(offscreenCanvas, 0, 0)
      // ctx.drawImage(offscreenCanvas, 0, 0, video.videoWidth, video.videoHeight, 0, 0, dstWidth, dstHeight)

      // ctx.drawImage(video, 0, 0)
      // offscreenCtx.drawImage(video, 0, 0)
      
      const sourceImage = this.uploadedImage
      const targetImage = canvas.toDataURL('image/jpeg')
      
      const compareFaces = async(source, target, loading) => {
        loading = true
        const rekognition = new AWS.Rekognition()
        const sourceImage = this.base64ToBinary(source)
        const targetImage = this.base64ToBinary(target)
        const params = {
          SourceImage: { Bytes: sourceImage },
          TargetImage: { Bytes: targetImage }
        }
        const fetchAPI = () => new Promise((resolve, reject) => {
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
        return fetchAPI().then((res => {
          loading = false
          return res
        })).catch((e => {
          loading = false
          return e
        }))
      }

      const drawRect = ((ctx, boundingBoxParams) => {
        console.log(ctx, boundingBoxParams)
        if(boundingBoxParams.length === 0) return
        ctx.lineWidth = 2
        ctx.strokeStyle = 'red'
        ctx.beginPath()
        ctx.rect(
          boundingBoxParams.Left * canvas.width,
          boundingBoxParams.Top * canvas.height,
          boundingBoxParams.Width * canvas.width,
          boundingBoxParams.Height * canvas.height
        )
        ctx.stroke()
      })

      compareFaces(sourceImage, targetImage, this.loading).then(result => {
        console.log(result)
        if(result.FaceMatches.length) {
          this.boundingBox = {
            Height: result.FaceMatches[0].Face.BoundingBox.Height,
            Left: result.FaceMatches[0].Face.BoundingBox.Left,
            Top: result.FaceMatches[0].Face.BoundingBox.Top,
            Width: result.FaceMatches[0].Face.BoundingBox.Height
          }
          this.message = '見つかりました！'
          console.log('見つかりました！')
          // ctx.clearRect(0, 0, canvas.width, canvas.height)
          // ctx.drawImage(canvas, 0, 0)
          drawRect(ctx, this.boundingBox)
        } else {
          this.boundingBox = {}
          this.message = '見つかりませんでした。'
          console.log('見つかりませんでした。')
        }
      }).catch(e => {
        this.boundingBox = {}
        this.message = '見つかりませんでした。'
        console.log(e)
      })
    },

    clear: function() {
      this.message = ""
      const canvas = document.getElementById("canvas")
      const ctx = canvas.getContext("2d")
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    },

    download: function() {
      if (this.boundingBox.length === 0) return

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

      const canvas = document.getElementById("canvas")
      const link = document.createElement("a")
      link.href = canvas.toDataURL("image/jpg")
      link.download = `${DateTimeStr()}hitosagashi.jpg`
      link.click()
    },

    startAutoMode: function() {
      let me = this
      const video = document.getElementById("video")

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
        if(me.boundingBox.length === 0) return
        ctx.lineWidth = 2
        ctx.strokeStyle = 'red'
        ctx.rect(
          me.boundingBox.left,
          me.boundingBox.top,
          me.boundingBox.width,
          me.boundingBox.height
        )
        ctx.stroke()
      })

      // const compareFaces = async() => {
      //   const rekognition = new AWS.Rekognition()
      //   const sourceImage = base64ToBinary(this.uploadedImage)
      //   const targetImage = base64ToBinary(canvas.toDataURL('image/jpeg'))
      //   const params = {
      //     SourceImage: { Bytes: sourceImage },
      //     TargetImage: { Bytes: targetImage }
      //   }
      //   return new Promise((resolve, reject) => {
      //     rekognition.compareFaces(params, (err, data) => {
      //       if(err) {
      //         console.log(err, err.stack)
      //         reject(err) 
      //       } else {
      //         console.log(data)
      //         resolve(data)
      //       }
      //     })
      //   })
      // }

      // const base64ToBinary = (base64) => {
      //  let bin = atob(base64.replace(/^.*,/, ''))
      //  let buffer = new Uint8Array(bin.length)
      //  for (var i = 0; i < bin.length; i++) {
      //    buffer[i] = bin.charCodeAt(i)
      //  }
      //  return buffer 
      // }

      // // let boundingBox = {}

      // const fetchBoundingBox = () => {
      //   if(intervalCount > 20) return clearInterval(intervalId)
      //   compareFaces().then((res => {
      //     if(res.FaceMatches.length) {
      //         me.boundingBox = {
      //           height: res.FaceMatches[0].Face.BoundingBox.Height * canvas.height,
      //           left: res.FaceMatches[0].Face.BoundingBox.Left * canvas.width,
      //           top: res.FaceMatches[0].Face.BoundingBox.Top * canvas.height,
      //           width: res.FaceMatches[0].Face.BoundingBox.Height * canvas.width
      //         }
      //         me.message ='見つかりました！'
      //     } else {
      //       me.boundingBox = {}
      //       me.message ='探しています...'
      //     }
      //   }))
      //   intervalCount++
      // }

      // let intervalCount = 0
      // let intervalId = window.setInterval(fetchBoundingBox, 3000)
      // window.setInterval(function() {
      //   console.log({boundingBox})
      // }, 3000)
      
      drawCanvasLoop()
    },

    // fetchAPI: async function() {
    //   let me = this
    //   const fetchBoundingBox = () => {
    //     if(intervalCount > 20) return clearInterval(intervalId)
    //     compareFaces().then((res => {
    //       if(res.FaceMatches.length) {
    //           me.boundingBox = {
    //             height: res.FaceMatches[0].Face.BoundingBox.Height * canvas.height,
    //             left: res.FaceMatches[0].Face.BoundingBox.Left * canvas.width,
    //             top: res.FaceMatches[0].Face.BoundingBox.Top * canvas.height,
    //             width: res.FaceMatches[0].Face.BoundingBox.Height * canvas.width
    //           }
    //           me.message ='見つかりました！'
    //       } else {
    //         me.boundingBox = {}
    //         me.message ='探しています...'
    //       }
    //     }))
    //     intervalCount++
    //   }

    //   const compareFaces = async() => {
    //     const video = document.getElementById('video')

    //     // 処理用Canvas
    //     const offscreenCanvas = document.createElement("canvas")
    //     const offscreenCtx = offscreenCanvas.getContext("2d")
    //     offscreenCtx.drawImage(video, 0, 0)        

    //     const rekognition = new AWS.Rekognition()
    //     const sourceImage = base64ToBinary(this.uploadedImage)
    //     const targetImage = base64ToBinary(offscreenCanvas.toDataURL('image/jpeg'))
    //     const params = {
    //       SourceImage: { Bytes: sourceImage },
    //       TargetImage: { Bytes: targetImage }
    //     }
    //     return new Promise((resolve, reject) => {
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
    //   }

    //   const base64ToBinary = (base64) => {
    //    let bin = atob(base64.replace(/^.*,/, ''))
    //    let buffer = new Uint8Array(bin.length)
    //    for (var i = 0; i < bin.length; i++) {
    //      buffer[i] = bin.charCodeAt(i)
    //    }
    //    return buffer 
    //   }

    //   let intervalCount = 0
    //   let intervalId = window.setInterval(fetchBoundingBox, 3000)
    //   window.setInterval(function() {
    //     console.log(me.boundingBox)
    //   }, 3000)

    // },

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

    // stopSearch: function(animationFrameCallbackId) {
    //   cancelAnimationFrame(animationFrameCallbackId)
    // },

    // frameShooting: function() {
    //   var video = document.getElementById('video')
    //   var canvas = document.getElementById('frameshot')
    //   var ctx = canvas.getContext('2d')
    //   var width = video.offsetWidth;
    //   var height = video.offsetHeight
    //   canvas.setAttribute('width', width)
    //   canvas.setAttribute('height', height)
    //   ctx.drawImage(video, 0, 0, width, height)
    // },
    // apiTest: function() {
    //   axios
    //     .get('https://api.coindesk.com/v1/bpi/currentprice.json')
    //     .then(res => (window.alert(res)))
    // },
    // sendToS3: function() {
    //   //WIP
    //   var canvas = document.getElementById('canvas')
    //   var bucketName = "hitosagashi"
    //   var fileName = Date.now().toString() + '.jpg'
    //   var s3 = new AWS.S3({
    //     params: {
    //       Bucket: bucketName
    //     }
    //   })
    //   var base64 = canvas.toDataURL('image/jpeg')
    //   var blob = dataURItoBlob(base64)
    //   s3.putObject({
    //     Key: fileName,
    //     Body: blob
    //   }, function(err, data) {
    //     if(err) console.log(err, err.stack)
    //     else console.log(data)
    //   })

    //   function dataURItoBlob(dataURI) {
    //     var binary = atob(dataURI.split(',')[1]);
    //     var array = [];
    //     for(var i = 0; i < binary.length; i++) {
    //       array.push(binary.charCodeAt(i));
    //     }
    //   return new Blob([new Uint8Array(array)], {type: 'image/jpeg'});
    //   }
    // },
    // sendToRekognition: function() {
    //   var canvas = document.getElementById('canvas')
    //   var base64 = canvas.toDataURL('image/jpeg')
    //   var rekognition = new AWS.Rekognition()
    //   // var collectionId = "myphotos"
    //   var buf = this.base64ToBinary(base64)
    //   var params = {
    //     CollectionId: this.collectionId,
    //     Image: {
    //       Bytes: buf
    //     }
    //   }
    //   rekognition.searchFacesByImage(params, function(err, data) {
    //     if(err) console.log(err, err.stack)
    //     else console.log(data) 
    //   })

    // },

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
        let file = e.target.result
        let orientation = 0
        EXIF.getData(e.target.result, function(){
          orientation = e.exifdata.Orientation
          if(orientation === undefined){
            orientation = 1
          }
        })
        this.uploadedImage = file
      }
      reader.readAsDataURL(file)
    },

    consoleLog: function() {
      console.log(typeof(this.uploadedImage))
    },
  }
}
</script>

<style scoped>
.photo-selector {
  width: 100%;
  height: 57px;
  background: #fff;
  position: relative;
  z-index: 2;
  top: 0;
  margin: auto;
}
.camera {
  z-index: 100;
}

.message {
  position: absolute;
  color: #fff;
  font-style: bold;
  text-shadow: 2px 1px 0 #000;
  top: 55%;
  left: 30%;
  z-index: 3;
}

.image {
  z-index: 4;
}

#video {
  width: 100%;
  max-width: 1280px;
  object-fit: cover;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  margin: auto;
}
#canvas {
  /* width: 100%; */
  /* height: 80%; */
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  margin: auto;
}

.v-window {
  height: calc(100% - 48px); /* タブ領域の高さを引く */
}
</style>