<template>
  <div class="camera">
    <h1>This is an camera page</h1>
    <button>start</button>
    <video id="video" autoplay playsinline="true"></video>
  </div>
</template>
<script>
export default {
  mounted() {
    var video = document.getElementById('video')
    var constrains = { video: true, audio: false }

    navigator.mediaDevices.getUserMedia(constrains)
      .then((stream) => {
        video.srcObject = stream
    }).catch((err) => {
      window.alert(err.name + ': ' + err.message)
    })
  }
}
</script>
