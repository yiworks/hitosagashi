<template>
  <v-app>
    <v-content class="wallpaper" v-bind:class="{ 'align-center': $route.path === '/' }">
      <router-view/>
    </v-content>

    <!-- <v-bottom-navigation
      v-model="bottomNav"
      v-if="$route.path !== '/'"
      class="align-center"
    >
      <v-btn value="recent">
        <span>Recent</span>
        <v-icon>mdi-history</v-icon>
      </v-btn>

      <v-btn value="favorites">
        <span>Favorites</span>
        <v-icon>mdi-heart</v-icon>
      </v-btn>

      <v-btn value="nearby">
        <span>Nearby</span>
        <v-icon>mdi-map-marker</v-icon>
      </v-btn>
    </v-bottom-navigation> -->
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
