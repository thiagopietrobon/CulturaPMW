<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import EventoCard from '../../components/eventos/EventoCard.vue'
import type { Evento } from '../../models/Evento'
import type { Produtor } from '../../models/Produtor'
import { eventoService } from '../../services/EventoService'

const route = useRoute()
const produtor = ref<Produtor | null>(null)
const eventos = ref<Evento[]>([])
const carregando = ref(true)

onMounted(async () => {
  const id = String(route.params.id ?? '')
  try {
    const prod = await eventoService.buscarProdutorPorId(id)
    produtor.value = prod
    if (prod) {
      eventos.value = await eventoService.listarEventosPorProdutor(id)
    }
  } catch (e) {
    console.error(e)
  } finally {
    carregando.value = false
  }
})
</script>

<template>
  <div class="perfil-container">
    <RouterLink to="/" class="voltar-link">← Voltar para a agenda</RouterLink>

    <div v-if="carregando" class="estado-box">
      Carregando perfil do produtor...
    </div>

    <div v-else-if="!produtor" class="estado-box">
      <h2>Perfil indisponível</h2>
      <p>O perfil deste produtor não está disponível no momento.</p>
    </div>

    <template v-else>
      <header class="produtor-header">
        <span class="tag-perfil">{{ produtor.getTipoPerfil() }}</span>
        <h1>{{ produtor.nome }}</h1>
        <p v-if="produtor.descricao" class="bio">{{ produtor.descricao }}</p>
        <p class="contato">Contato: {{ produtor.telefone }}</p>
      </header>

      <section class="eventos-produtor">
        <h2>Eventos publicados por {{ produtor.nome }}</h2>

        <div v-if="eventos.length === 0" class="estado-box">
          Nenhum evento ativo no momento.
        </div>

        <div v-else class="eventos-grid">
          <EventoCard
            v-for="evento in eventos"
            :key="evento.id"
            :evento="evento"
          />
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.perfil-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
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

.produtor-header {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tag-perfil {
  align-self: flex-start;
  background-color: #e0f2fe;
  color: #0369a1;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 999px;
}

.produtor-header h1 {
  margin: 0;
  color: #0f172a;
}

.bio {
  margin: 4px 0;
  color: #334155;
  line-height: 1.5;
}

.contato {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #1154d9;
}

.eventos-produtor h2 {
  margin: 0 0 16px 0;
  font-size: 1.25rem;
  color: #0f172a;
}

.eventos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}
</style>