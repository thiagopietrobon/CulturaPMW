
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const routeAtual = useRoute()

const possuiFundoAuth = computed(
  () => routeAtual.meta.transition === 'auth'
)
</script>

<template>
  <div
    class="app-shell"
    :class="{ 'app-shell--auth': possuiFundoAuth }"
  >
    <!-- Fundo persistente: não participa da transição -->
    <div
      v-if="possuiFundoAuth"
      class="auth-shared-background"
      aria-hidden="true"
    ></div>

    <!-- Somente o conteúdo das telas é animado -->
    <div class="app-route-layer">
      <RouterView v-slot="{ Component, route }">
        <Transition
          :name="
            route.meta.transition === 'auth'
              ? 'auth-dissolve'
              : 'no-transition'
          "
        >
          <component
            :is="Component"
            :key="
              route.meta.transition === 'auth'
                ? route.fullPath
                : route.matched[0]?.path || route.path
            "
          />
        </Transition>
      </RouterView>
    </div>
  </div>
</template>

<style src="./assets/styles/transicao-basica.css"></style>
