
<template>
  <header class="header">
    <div class="container header-content">
      <RouterLink to="/" class="brand">
        <span class="brand-name">CulturaPMW</span>
        <span class="brand-description">
          Cultura, esporte e lazer em Palmas
        </span>
      </RouterLink>

      <nav class="navigation">
        <RouterLink to="/" class="nav-link">
          Início
        </RouterLink>

        <a href="#eventos" class="nav-link">
          Eventos
        </a>

        <a href="#sobre" class="nav-link">
          Sobre
        </a>
      </nav>

      <a href="#eventos" class="header-button">
        Explorar eventos
      </a>
    </div>
  </header>
</template>

<style scoped>
.header {
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.container {
  width: min(1120px, calc(100% - 40px));
  margin: 0 auto;
}

.header-content {
  min-height: 82px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.brand {
  display: flex;
  flex-direction: column;
}

.brand-name {
  color: var(--color-primary);
  font-size: 24px;
  font-weight: 700;
}

.brand-description {
  color: var(--color-text-muted);
  font-size: 12px;
}

.navigation {
  display: flex;
  align-items: center;
  gap: 28px;
}

.nav-link {
  color: var(--color-text);
  font-size: 14px;
  transition: color 0.2s;
}

.nav-link:hover {
  color: var(--color-primary);
}

.header-button {
  padding: 10px 18px;
  background-color: var(--color-primary);
  color: var(--color-surface);
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 600;
  transition: background-color 0.2s;
}

.header-button:hover {
  background-color: var(--color-secondary);
}

@media (max-width: 700px) {
  .header-content {
    flex-wrap: wrap;
    justify-content: center;
    padding: 16px 0;
  }

  .brand {
    width: 100%;
    align-items: center;
  }

  .navigation {
    gap: 16px;
  }

  .header-button {
    display: none;
  }
}
</style>