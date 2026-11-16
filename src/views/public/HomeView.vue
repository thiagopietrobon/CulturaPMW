
<template>
  <main class="home">
    <div class="container">
      <h1>Bem-vindo ao CulturaPMW</h1>

      <p>
        Descubra eventos culturais, esportivos e de lazer
        em Palmas.
      </p>
    </div>
  </main>
</template>

<style scoped>
.home {
  padding: 64px 0;
}

.container {
  width: min(1120px, calc(100% - 40px));
  margin: 0 auto;
}

h1 {
  color: var(--color-dark);
  font-size: 32px;
  margin-bottom: 12px;
}

p {
  color: var(--color-text-muted);
  font-size: 16px;
}
</style>