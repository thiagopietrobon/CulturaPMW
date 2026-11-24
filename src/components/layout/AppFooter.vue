
<template>
  <footer id="sobre" class="footer">
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
  position: relative;
  overflow: hidden;
  isolation: isolate;
  padding: 44px 0 36px;
  background:
    radial-gradient(700px 300px at 85% 0%, rgb(17 124 217 / 35%), transparent 70%),
    linear-gradient(135deg, #0a2540 0%, #08428c 100%);
  color: #fff;
}

/* Linha superior em gradiente animado */
.footer::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: 3px;
  background: linear-gradient(90deg, #117cd9, #6fb3ff, #1154d9, #117cd9);
  background-size: 300% 100%;
  animation: cp-gradient-pan 8s ease infinite;
}

/* Brilho flutuante decorativo */
.footer::after {
  content: '';
  position: absolute;
  z-index: -1;
  bottom: -140px;
  left: -80px;
  width: 340px;
  height: 340px;
  border-radius: 50%;
  background: radial-gradient(circle, rgb(17 124 217 / 35%), transparent 70%);
  animation: cp-drift 14s ease-in-out infinite;
}

.container {
  width: min(1200px, calc(100% - 40px));
  margin: 0 auto;
}

.footer-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.footer h2 {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
  font-size: 22px;
  font-weight: 850;
  letter-spacing: -0.02em;
}

.footer h2::before {
  content: 'C';
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border-radius: 11px;
  background: #fff;
  box-shadow: 0 6px 16px rgb(4 19 40 / 30%);
  color: #1154d9;
  font-size: 18px;
  font-weight: 900;
}

.footer p {
  color: #c9dcf5;
  font-size: 14px;
}

.copyright {
  padding: 8px 14px;
  border: 1px solid rgb(255 255 255 / 14%);
  border-radius: 999px;
  background: rgb(255 255 255 / 7%);
  font-size: 12.5px !important;
}

@media (max-width: 600px) {
  .footer-content {
    flex-direction: column;
    align-items: flex-start;
  }
}

/* ===== TEMA ESCURO (gerado por scripts/gerar-tema-escuro.mjs — não editar este trecho) ===== */
html[data-theme='escuro'] .footer {
  background-image: radial-gradient(700px 300px at 85% 0%, rgb(17 124 217 / 35%), transparent 70%), linear-gradient(135deg, #0a2540 0%, #08428c 100%);
  background-color: transparent;
  color: #fff;
}

html[data-theme='escuro'] .footer::before {
  background-image: linear-gradient(90deg, #117cd9, #6fb3ff, #1154d9, #117cd9);
  background-color: transparent;
}

html[data-theme='escuro'] .footer::after {
  background-image: radial-gradient(circle, rgb(17 124 217 / 35%), transparent 70%);
  background-color: transparent;
}

html[data-theme='escuro'] .footer h2::before {
  background-image: none;
  background-color: #fff;
  box-shadow: 0 6px 16px rgb(4 19 40 / 30%);
  color: #1154d9;
}

html[data-theme='escuro'] .footer p {
  color: #c9dcf5;
}

html[data-theme='escuro'] .copyright {
  border: 1px solid rgb(255 255 255 / 14%);
  background-image: none;
  background-color: rgb(255 255 255 / 7%);
}
/* ===== FIM DO TEMA ESCURO GERADO ===== */
</style>
