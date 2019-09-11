import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'
import Camera from './views/Camera.vue'
import CameraAuto from './views/CameraAuto.vue'
// import About from './views/About.vue'

Vue.use(Router)

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/camera',
      name: 'camera',
      component: Camera
    },
    {
      path: '/camera-auto',
      name: 'camera-auto',
      component: CameraAuto
    }
  ]
})
