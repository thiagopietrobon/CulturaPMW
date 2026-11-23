<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '../../services/AuthService'
import { useAuth } from '../../composables/useAuth'
import BotaoTema from './BotaoTema.vue'

const router = useRouter()
const { perfil, administrador, autenticado, carregando } = useAuth()
const rotaAreaProdutor = computed(() => {
  if (perfil.value?.status === 'REPROVADO') return '/produtor/reprovado'
  if (perfil.value?.status === 'SUSPENSO') return '/produtor/suspenso'
  if (perfil.value?.status === 'AGUARDANDO_APROVACAO') return '/produtor/aguardando-aprovacao'
  return '/produtor/painel'
})
const rotaMinhaArea = computed(() => administrador.value ? '/admin' : rotaAreaProdutor.value)

async function sair() {
  try {
    await authService.sair()
    await router.push('/')
  } catch (error) {
    console.error(error)
    window.alert('Não foi possível encerrar a sessão. Tente novamente.')
  }
}
</script>

<template>
  <header class="header">
    <div class="container header-content">
      <RouterLink to="/" class="brand">
        <span class="brand-name">CulturaPMW</span>
        <span class="brand-description">Cultura, esporte e lazer em Palmas</span>
      </RouterLink>

      <nav class="navigation">
        <RouterLink to="/" class="nav-link">Início</RouterLink>
        <a href="/#eventos" class="nav-link">Eventos</a>
        <a href="/#sobre" class="nav-link">Sobre</a>
      </nav>

      <div class="header-account">
        <BotaoTema />
        <template v-if="autenticado && (perfil || administrador)">
          <RouterLink :to="rotaMinhaArea" class="header-button">
            Minha área
          </RouterLink>
          <button class="header-account-link" type="button" @click="sair">Sair</button>
        </template>
        <template v-else-if="!carregando">
          <RouterLink to="/login" class="header-account-link">Entrar</RouterLink>
          <RouterLink to="/produtor/cadastro" class="header-button">Sou produtor</RouterLink>
        </template>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 50;
  border-bottom: 1px solid rgb(216 228 245 / 80%);
  background: rgb(255 255 255 / 78%);
  box-shadow: 0 4px 24px rgb(8 46 99 / 6%);
  backdrop-filter: saturate(160%) blur(14px);
  -webkit-backdrop-filter: saturate(160%) blur(14px);
  animation: cp-fade-down 0.6s var(--ease-out) backwards;
}

/* Linha fina em gradiente no topo */
.header::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: 3px;
  background: linear-gradient(90deg, #117cd9, #1154d9, #08428c, #117cd9);
  background-size: 300% 100%;
  animation: cp-gradient-pan 8s ease infinite;
}

.container {
  width: min(1200px, calc(100% - 40px));
  margin: 0 auto;
}

.header-content {
  display: flex;
  min-height: 76px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

/* Marca: selo "C" em gradiente + nome */
.brand {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto auto;
  column-gap: 12px;
  align-items: center;
  text-decoration: none;
}

.brand::before {
  content: 'C';
  display: grid;
  width: 44px;
  height: 44px;
  grid-row: 1 / 3;
  place-items: center;
  border-radius: 14px;
  background: var(--gradient-brand);
  box-shadow: 0 8px 18px rgb(8 66 140 / 28%), inset 0 1px 0 rgb(255 255 255 / 25%);
  color: #fff;
  font-size: 21px;
  font-weight: 900;
  transition: transform 0.35s var(--ease-spring);
}

.brand:hover::before {
  transform: rotate(-8deg) scale(1.06);
}

.brand-name {
  background: linear-gradient(110deg, #08428c 0%, #1154d9 60%, #117cd9 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-size: 22px;
  font-weight: 850;
  letter-spacing: -0.03em;
  line-height: 1.1;
}

.brand-description {
  color: #6f83a2;
  font-size: 12px;
  font-weight: 600;
}

.navigation {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px;
  border: 1px solid #e3ecf8;
  border-radius: 999px;
  background: rgb(255 255 255 / 70%);
}

.nav-link {
  position: relative;
  padding: 8px 16px;
  border-radius: 999px;
  color: #3c5478;
  font-size: 14px;
  font-weight: 650;
  transition: color var(--dur-fast) ease, background-color var(--dur-fast) ease;
}

.nav-link::after {
  content: '';
  position: absolute;
  right: 16px;
  bottom: 4px;
  left: 16px;
  height: 2px;
  border-radius: 2px;
  background: var(--gradient-brand);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform var(--dur-base) var(--ease-out);
}

.nav-link:hover {
  background: #f1f7ff;
  color: #08428c;
}

.nav-link:hover::after {
  transform: scaleX(1);
}

.nav-link.router-link-exact-active {
  background: #eaf2ff;
  color: #1154d9;
}

.header-account {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-button {
  position: relative;
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  overflow: hidden;
  padding: 0 20px;
  border: 1px solid #08428c;
  border-radius: 12px;
  background: var(--gradient-brand);
  box-shadow: 0 8px 20px rgb(8 66 140 / 24%), inset 0 1px 0 rgb(255 255 255 / 20%);
  color: #fff;
  font-size: 14px;
  font-weight: 750;
  cursor: pointer;
  transition: transform var(--dur-fast) ease, box-shadow var(--dur-fast) ease, filter var(--dur-fast) ease;
}

/* Brilho que atravessa o botão no hover */
.header-button::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, transparent 30%, rgb(255 255 255 / 35%) 50%, transparent 70%);
  transform: translateX(-120%);
  transition: transform 0.6s var(--ease-out);
}

.header-button:hover {
  transform: translateY(-2px);
  filter: brightness(1.05);
  box-shadow: 0 12px 26px rgb(8 66 140 / 32%), inset 0 1px 0 rgb(255 255 255 / 22%);
}

.header-button:hover::after {
  transform: translateX(120%);
}

.header-account-link {
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  padding: 0 16px;
  border: 1.5px solid #d0dcef;
  border-radius: 12px;
  background: #fff;
  color: #123d78;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: border-color var(--dur-fast) ease, background-color var(--dur-fast) ease, color var(--dur-fast) ease, transform var(--dur-fast) ease;
}

.header-account-link:hover {
  transform: translateY(-1px);
  border-color: #117cd9;
  background: #f4f9ff;
  color: #08428c;
}

@media (max-width: 860px) {
  /* No celular o cabeçalho ocupa mais altura: deixa de ser fixo */
  .header {
    position: relative;
  }

  .header-content {
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 0;
  }

  .navigation {
    order: 3;
    width: 100%;
    justify-content: center;
  }

  .nav-link {
    flex: 1;
    text-align: center;
  }
}

@media (max-width: 520px) {
  .brand-description {
    display: none;
  }

  .brand {
    grid-template-rows: auto;
  }

  .brand::before {
    width: 38px;
    height: 38px;
    grid-row: auto;
    font-size: 18px;
  }

  .brand-name {
    font-size: 19px;
  }

  .header-account {
    order: 2;
    width: 100%;
  }

  .header-button,
  .header-account-link {
    min-height: 40px;
    flex: 1;
    justify-content: center;
    padding: 0 12px;
    font-size: 13.5px;
  }
}

/* Ajuste manual do modo escuro: nome em gradiente claro.
   O ".header" extra garante prioridade sobre o trecho gerado abaixo. */
html[data-theme='escuro'] .header .brand-name {
  background-image: linear-gradient(110deg, #e2eeff 0%, #8fc0ff 60%, #5fa8ff 100%);
}

/* ===== TEMA ESCURO (gerado por scripts/gerar-tema-escuro.mjs — não editar este trecho) ===== */
html[data-theme='escuro'] .header {
  border-bottom: 1px solid rgb(34 57 90 / 80%);
  background-image: none;
  background-color: rgb(19 27 40 / 78%);
  box-shadow: 0 4px 24px rgb(0 0 0 / 13.2%);
}

html[data-theme='escuro'] .header::before {
  background-image: linear-gradient(90deg, #117cd9, #1154d9, #08428c, #117cd9);
  background-color: transparent;
}

html[data-theme='escuro'] .brand::before {
  background-image: linear-gradient(110deg, #117cd9 0%, #1154d9 58%, #08428c 100%);
  background-color: transparent;
  box-shadow: 0 8px 18px rgb(0 0 0 / 55%), inset 0 1px 0 rgb(255 255 255 / 25%);
  color: #ffffff;
}

html[data-theme='escuro'] .brand-name {
  background-image: linear-gradient(110deg, #08428c 0%, #1154d9 60%, #117cd9 100%);
  background-color: transparent;
}

html[data-theme='escuro'] .brand-description {
  color: #a4b0c4;
}

html[data-theme='escuro'] .navigation {
  border: 1px solid #203755;
  background-image: none;
  background-color: rgb(19 27 40 / 70%);
}

html[data-theme='escuro'] .nav-link {
  color: #b5c4da;
}

html[data-theme='escuro'] .nav-link::after {
  background-image: linear-gradient(110deg, #117cd9 0%, #1154d9 58%, #08428c 100%);
  background-color: transparent;
}

html[data-theme='escuro'] .nav-link:hover {
  background-image: none;
  background-color: #111f32;
  color: #a8c9f4;
}

html[data-theme='escuro'] .nav-link.router-link-exact-active {
  background-image: none;
  background-color: #121f35;
  color: #88abf0;
}

html[data-theme='escuro'] .header-button {
  border: 1px solid #08428c;
  background-image: linear-gradient(110deg, #117cd9 0%, #1154d9 58%, #08428c 100%);
  background-color: transparent;
  box-shadow: 0 8px 20px rgb(0 0 0 / 52.8%), inset 0 1px 0 rgb(255 255 255 / 20%);
  color: #ffffff;
}

html[data-theme='escuro'] .header-button::after {
  background-image: linear-gradient(105deg, transparent 30%, rgb(255 255 255 / 35%) 50%, transparent 70%);
  background-color: transparent;
}

html[data-theme='escuro'] .header-button:hover {
  box-shadow: 0 12px 26px rgb(0 0 0 / 55%), inset 0 1px 0 rgb(255 255 255 / 22%);
}

html[data-theme='escuro'] .header-account-link {
  border: 1.5px solid #243b5f;
  background-image: none;
  background-color: #131b28;
  color: #aecbf3;
}

html[data-theme='escuro'] .header-account-link:hover {
  border-color: #117cd9;
  background-image: none;
  background-color: #101f31;
  color: #a8c9f4;
}
/* ===== FIM DO TEMA ESCURO GERADO ===== */
</style>
