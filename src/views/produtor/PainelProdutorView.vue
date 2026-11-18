<script setup lang="ts">
import { useAuth } from '../../composables/useAuth'
import '../../assets/styles/produtor.css'

const { perfil } = useAuth()
</script>

<template>
  <main class="produtor-area-page">
    <header class="produtor-area-heading">
      <div>
        <p class="produtor-eyebrow">ÁREA DO PRODUTOR</p>
        <h1>Olá, {{ perfil?.nome ?? 'produtor' }}!</h1>
        <p>Gerencie seus dados e acompanhe sua presença no CulturaPMW.</p>
      </div>
      <span class="produtor-status-pill produtor-status-approved">Cadastro aprovado</span>
    </header>

    <section class="produtor-dashboard-grid">
      <article class="produtor-dashboard-card">
        <span class="produtor-dashboard-icon">♙</span>
        <h2>Meu perfil</h2>
        <p>Consulte e atualize seus dados cadastrais e informações de contato.</p>
        <RouterLink to="/produtor/perfil" class="produtor-text-link">Acessar perfil →</RouterLink>
      </article>
      <article class="produtor-dashboard-card">
        <span class="produtor-dashboard-icon">▣</span>
        <h2>Meus eventos</h2>
        <p>Publique novas atrações e atualize as informações dos eventos que você cadastrou.</p>
        <RouterLink to="/produtor/eventos" class="produtor-text-link">Gerenciar meus eventos →</RouterLink>
      </article>
    </section>
  </main>
</template>
