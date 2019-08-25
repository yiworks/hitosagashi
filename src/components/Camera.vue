<template>
  <div id="camera">
    <h1>Camera</h1>

    <video id="video" controls autoplay playsinline="true"></video>
  </div>
</template>

<script>
export default {
  
}

var video = document.getElementById('video')
// var handleSuccess = function(stream) {
  // player.srcObject = stream;
// }

navigator.mediaDevices.getUserMedia({video: true})
  .then((stream) => {
    video.srcObject = stream;
  }).catch((err) => {
    window.alert(err.name + ': ' + err.message)
  })
</script>

<style lang="scss">

</style>