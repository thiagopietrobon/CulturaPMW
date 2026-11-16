
<template>
  <footer class="footer">
    <div class="container footer-content">
      <div>
        <h2>CulturaPMW</h2>
        <p>
          Descubra e valorize a cultura de Palmas.
        </p>
      </div>

      <p class="copyright">
        © 2026 CulturaPMW. Todos os direitos reservados.
      </p>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background-color: var(--color-dark);
  color: var(--color-surface);
  padding: 32px 0;
}

.container {
  width: min(1120px, calc(100% - 40px));
  margin: 0 auto;
}

.footer-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.footer h2 {
  font-size: 20px;
  margin-bottom: 4px;
}

.footer p {
  font-size: 13px;
}

.copyright {
  opacity: 0.8;
}

@media (max-width: 600px) {
  .footer-content {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
