<template>
  <RouterView v-slot="{ Component, route }">
    <Transition
      :name="route.meta.transition === 'auth' ? 'auth-dissolve' : 'no-transition'"
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
</template>

<style src="./assets/styles/transicao-basica.css"></style>
