<template>
  <v-container>
    <v-layout
      text-center
      wrap
    >
      <v-flex>
        <v-content class="mb-50">
          <h1 class="display-2 font-weight-bold mb-3">
            hitosagashi
          </h1>
          <p class="subheading font-weight-regular mt-10 mb-30">
            大勢の人の中からでも見つけたい人を見つけ出せます<br><br>
            カメラをかざして人を見つけてみましょう
          </p>        
        </v-content>
        <br>
        <v-content class="mb-20">
          <v-btn to="/camera">はじめる</v-btn>
        </v-content>
        <br>
        <v-content>
          <v-btn to="/camera-auto">はじめる（自動モード）</v-btn>
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
