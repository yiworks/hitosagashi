<template>
  <v-container>
    <v-layout
      text-center
      wrap
    >
      <v-flex>
        <v-content style="mb-20">
          <h1 class="display-2 font-weight-bold mb-3">
            hitosagashi
          </h1>
          <p class="subheading font-weight-regular mt-10 mb-30">
            カメラをかざして人を見つけてみましょう
          </p>
        </v-content>
        <v-content>
          <v-btn to="/camera">はじめる</v-btn>
        </v-content>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>

export default {
  components: {
  },
};
</script>
