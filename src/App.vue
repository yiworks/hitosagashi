<template>
  <v-app>
    <v-content class="align-center wallpaper">
      <router-view/>
    </v-content>
  </v-app>
</template>

<script>

export default {
  name: 'App',
  components: {
  },
  data: () => ({
    //
  }),
};
</script>

<style scoped>
.wallpaper {
  background: url("./static/images/wallpaper.jpg");
  background-size: cover;
}

</style>
