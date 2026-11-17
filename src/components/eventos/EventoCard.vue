<script setup lang="ts">
import type { Evento } from '../../models/Evento'

defineProps<{
  evento: Evento
}>()
</script>

<template>
  <RouterLink :to="`/eventos/${evento.id}`" class="evento-card">
    <div class="card-imagem">
      <img
        v-if="evento.imagemUrl"
        :src="evento.imagemUrl"
        :alt="evento.titulo"
        loading="lazy"
      />
      <div v-else class="imagem-placeholder">
        <span>CulturaPMW</span>
      </div>
      <span class="badge-categoria">{{ evento.categoria.nome }}</span>
      <span v-if="evento.situacao === 'CONCLUIDO'" class="badge-concluido">
        Concluído
      </span>
    </div>

    <div class="card-conteudo">
      <time class="card-data">{{ evento.formatarDataInicio() }}</time>
      <h3 class="card-titulo">{{ evento.titulo }}</h3>
      <p class="card-local">{{ evento.endereco.bairro }} • {{ evento.endereco.regiao.nome }}</p>

      <div class="card-rodape">
        <span :class="['badge-valor', { gratuito: evento.gratuito }]">
          {{ evento.formatarValor() }}
        </span>
        <span class="ver-detalhes">Ver detalhes →</span>
      </div>
    </div>
  </RouterLink>
</template>

<style scoped>
.evento-card {
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.evento-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(8, 66, 140, 0.12);
}

.card-imagem {
  position: relative;
  height: 180px;
  background-color: #08428c;
}

.card-imagem img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.imagem-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 600;
  opacity: 0.85;
}

.badge-categoria {
  position: absolute;
  top: 10px;
  left: 10px;
  background-color: #1154d9;
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 999px;
}

.badge-concluido {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: #475569;
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 999px;
}

.card-conteudo {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 16px;
  gap: 8px;
}

.card-data {
  font-size: 0.82rem;
  font-weight: 600;
  color: #117cd9;
  text-transform: capitalize;
}

.card-titulo {
  margin: 0;
  font-size: 1.08rem;
  color: #0f172a;
  line-height: 1.3;
}

.card-local {
  margin: 0;
  font-size: 0.88rem;
  color: #475569;
}

.card-rodape {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.badge-valor {
  font-size: 0.82rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
  background-color: #f1f5f9;
  color: #334155;
}

.badge-valor.gratuito {
  background-color: #dcfce7;
  color: #166534;
}

.ver-detalhes {
  font-size: 0.85rem;
  font-weight: 600;
  color: #1154d9;
}
</style>