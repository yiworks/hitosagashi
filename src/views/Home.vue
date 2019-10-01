<template>
  <v-container>
    <v-layout
      text-center
      wrap
    >
      <v-flex>
        <v-content class="mb-5">
          <h1 class="display-2 mb-3">
            <img src="../static/images/logo.png" alt="ロゴ" style="width: 80%; max-width: 500px;">
          </h1>
          <p class="subheading font-weight-regular mt-10 mb-5">
            大勢の人の中からでも<br>見つけたい人を見つけ出せます<br><br>
            カメラをかざして人を見つけてみましょう
          </p>        
        </v-content>
        <br>
        <v-content>
          <v-btn to="/camera-auto" outlined x-large class="font-weight-bold">はじめる</v-btn>
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
