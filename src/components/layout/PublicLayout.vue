
<script setup lang="ts">
import AppHeader from './AppHeader.vue'
import AppFooter from './AppFooter.vue'
</script>

<template>
  <div class="page-layout">
    <AppHeader />

    <div class="page-content">
      <RouterView v-slot="{ Component, route }">
        <Transition name="pagina" mode="out-in">
          <component :is="Component" :key="route.fullPath" />
        </Transition>
      </RouterView>
    </div>

    <AppFooter />
  </div>
</template>

<style scoped>
.page-layout {
  position: relative;
  isolation: isolate;
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  background:
    radial-gradient(1200px 520px at 100% -10%, rgb(17 124 217 / 10%), transparent 60%),
    radial-gradient(900px 480px at -10% 30%, rgb(17 84 217 / 7%), transparent 60%),
    linear-gradient(180deg, #f4f8fe 0%, #eef4fc 100%);
}

.page-content {
  flex: 1;
  animation: cp-fade-in 0.5s ease backwards;
}

/* ===== TEMA ESCURO (gerado por scripts/gerar-tema-escuro.mjs — não editar este trecho) ===== */
html[data-theme='escuro'] .page-layout {
  background-image: radial-gradient(1200px 520px at 100% -10%, rgb(17 124 217 / 10%), transparent 60%), radial-gradient(900px 480px at -10% 30%, rgb(17 84 217 / 7%), transparent 60%), linear-gradient(180deg, #101d31 0%, #112034 100%);
  background-color: transparent;
}
/* ===== FIM DO TEMA ESCURO GERADO ===== */
</style>
