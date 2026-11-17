<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import type { Evento } from '../../models/Evento'
import { eventoService } from '../../services/EventoService'

const route = useRoute()
const evento = ref<Evento | null>(null)
const carregando = ref(true)
const erro = ref<string | null>(null)

function formatarDataCompleta(data: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'full',
    timeStyle: 'short'
  }).format(data)
}

onMounted(async () => {
  const id = String(route.params.id ?? '')
  try {
    evento.value = await eventoService.buscarPorId(id)
  } catch (e) {
    erro.value = 'Não foi possível carregar os dados do evento.'
    console.error(e)
  } finally {
    carregando.value = false
  }
})
</script>

<template>
  <div class="detalhes-container">
    <RouterLink to="/" class="voltar-link">← Voltar para a agenda</RouterLink>

    <div v-if="carregando" class="estado-box">
      Carregando informações do evento...
    </div>

    <div v-else-if="erro" class="estado-box erro">
      {{ erro }}
    </div>

    <div v-else-if="!evento" class="estado-box">
      <h2>Conteúdo indisponível</h2>
      <p>Este evento não foi encontrado, já foi encerrado há mais de 24 horas ou foi removido.</p>
    </div>

    <article v-else class="evento-artigo">
      <div v-if="evento.imagemUrl" class="banner">
        <img :src="evento.imagemUrl" :alt="evento.titulo" />
      </div>

      <div class="corpo">
        <div class="badges">
          <span class="badge-cat">{{ evento.categoria.nome }}</span>
          <span class="badge-regiao">{{ evento.endereco.regiao.nome }}</span>
          <span v-if="evento.situacao === 'CONCLUIDO'" class="badge-status">Concluído</span>
        </div>

        <h1>{{ evento.titulo }}</h1>

        <div class="info-grid">
          <div class="info-card">
            <strong>Data e Horário</strong>
            <p>Início: {{ formatarDataCompleta(evento.dataInicio) }}</p>
            <p>Término: {{ formatarDataCompleta(evento.dataFim) }}</p>
          </div>

          <div class="info-card">
            <strong>Entrada</strong>
            <p class="valor-destaque">{{ evento.formatarValor() }}</p>
          </div>

          <div class="info-card">
            <strong>Localização</strong>
            <p>{{ evento.endereco.getEnderecoCompleto() }}</p>
            <div class="mapas-acoes">
              <a :href="evento.endereco.gerarLinkMapa('google')" target="_blank" rel="noopener noreferrer" class="btn-mapa">
                Abrir no Google Maps
              </a>
              <a :href="evento.endereco.gerarLinkMapa('waze')" target="_blank" rel="noopener noreferrer" class="btn-mapa waze">
                Abrir no Waze
              </a>
            </div>
          </div>

          <div class="info-card">
            <strong>Organizador</strong>
            <p>{{ evento.produtor.nome }}</p>
            <RouterLink :to="`/produtores/${evento.produtor.id}`" class="link-produtor">
              Ver perfil e outros eventos do produtor →
            </RouterLink>
          </div>
        </div>

        <section class="descricao">
          <h2>Sobre o evento</h2>
          <p>{{ evento.descricao }}</p>
        </section>

        <section v-if="evento.linksExternos.length > 0" class="links-externos">
          <h2>Links Oficiais e Ingressos</h2>
          <div class="links-lista">
            <a
              v-for="link in evento.linksExternos"
              :key="link.id ?? link.url"
              :href="link.url"
              target="_blank"
              rel="noopener noreferrer"
              class="btn-externo"
            >
              {{ link.getRotulo() }} ↗
            </a>
          </div>
        </section>
      </div>
    </article>
  </div>
</template>

<style scoped>
.detalhes-container {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.voltar-link {
  color: #1154d9;
  font-weight: 600;
  text-decoration: none;
}

.estado-box {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  color: #475569;
}

.estado-box.erro {
  color: #b91c1c;
  border-color: #fecaca;
}

.evento-artigo {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}

.banner img {
  width: 100%;
  max-height: 380px;
  object-fit: cover;
  display: block;
}

.corpo {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.badge-cat {
  background-color: #1154d9;
  color: #ffffff;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
}

.badge-regiao {
  background-color: #e0f2fe;
  color: #0369a1;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
}

.badge-status {
  background-color: #475569;
  color: #ffffff;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
}

h1 {
  margin: 0;
  font-size: 1.8rem;
  color: #0f172a;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}

.info-card {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-card p {
  margin: 0;
  color: #334155;
  font-size: 0.92rem;
}

.valor-destaque {
  font-size: 1.15rem !important;
  font-weight: 700;
  color: #1154d9 !important;
}

.mapas-acoes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}

.btn-mapa {
  padding: 6px 12px;
  border-radius: 6px;
  background-color: #1154d9;
  color: #ffffff;
  text-decoration: none;
  font-size: 0.82rem;
  font-weight: 600;
}

.btn-mapa.waze {
  background-color: #08428c;
}

.link-produtor {
  margin-top: 4px;
  color: #117cd9;
  font-size: 0.88rem;
  font-weight: 600;
  text-decoration: none;
}

.descricao h2,
.links-externos h2 {
  margin: 0 0 8px 0;
  font-size: 1.2rem;
  color: #0f172a;
}

.descricao p {
  margin: 0;
  line-height: 1.6;
  color: #334155;
  white-space: pre-line;
}

.links-lista {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.btn-externo {
  padding: 10px 16px;
  border-radius: 8px;
  background-color: #1154d9;
  color: #ffffff;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.92rem;
}
</style>