<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { adminService, type CategoriaAdmin } from '../../services/AdminService'

const categorias = ref<CategoriaAdmin[]>([])
const busca = ref('')
const nome = ref('')
const categoriaEditando = ref<CategoriaAdmin | null>(null)
const carregando = ref(false)
const salvando = ref(false)
const erro = ref('')
const sucesso = ref('')

const filtradas = computed(() => {
  const termo = busca.value.trim().toLocaleLowerCase('pt-BR')
  return categorias.value.filter((categoria) => categoria.nome.toLocaleLowerCase('pt-BR').includes(termo))
})

async function carregar() {
  carregando.value = true
  erro.value = ''
  try {
    categorias.value = await adminService.listarCategorias()
  } catch (error) {
    console.error(error)
    erro.value = 'Não foi possível carregar as categorias. Confira as políticas RLS do Supabase.'
  } finally {
    carregando.value = false
  }
}

function limparFormulario() {
  nome.value = ''
  categoriaEditando.value = null
}

function editar(categoria: CategoriaAdmin) {
  categoriaEditando.value = categoria
  nome.value = categoria.nome
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function salvar() {
  const nomeLimpo = nome.value.trim()
  if (!nomeLimpo) {
    erro.value = 'Informe o nome da categoria.'
    return
  }

  salvando.value = true
  erro.value = ''
  sucesso.value = ''
  try {
    if (categoriaEditando.value) {
      await adminService.editarCategoria(categoriaEditando.value.id, nomeLimpo)
      sucesso.value = 'Categoria atualizada com sucesso.'
    } else {
      await adminService.criarCategoria(nomeLimpo)
      sucesso.value = 'Categoria cadastrada com sucesso.'
    }
    limparFormulario()
    await carregar()
  } catch (error) {
    console.error(error)
    erro.value = error instanceof Error ? error.message : 'Não foi possível salvar a categoria. Verifique se o nome já existe.'
  } finally {
    salvando.value = false
  }
}

async function excluir(categoria: CategoriaAdmin) {
  if (!window.confirm(`Excluir a categoria "${categoria.nome}"? Categorias utilizadas por eventos não podem ser removidas.`)) return
  erro.value = ''
  sucesso.value = ''
  try {
    await adminService.excluirCategoria(categoria.id)
    sucesso.value = 'Categoria excluída com sucesso.'
    await carregar()
  } catch (error) {
    console.error(error)
    erro.value = 'Não foi possível excluir. Verifique se existem eventos vinculados a esta categoria.'
  }
}

onMounted(carregar)
</script>

<template>
  <section class="admin-page">
    <div class="admin-page-heading">
      <div>
        <div class="admin-eyebrow">CULTURAPMW / CONFIGURAÇÕES</div>
        <h1>Categorias</h1>
        <p>Cadastre e mantenha as categorias usadas nos eventos e filtros públicos.</p>
      </div>
      <button class="admin-button admin-button-light" @click="carregar">↻ Atualizar</button>
    </div>

    <div v-if="sucesso" class="admin-alert admin-alert-success">{{ sucesso }}</div>
    <div v-if="erro" class="admin-alert admin-alert-error">{{ erro }}</div>

    <div class="admin-two-columns">
      <section class="admin-panel admin-form-panel">
        <div class="admin-panel-heading"><h2>{{ categoriaEditando ? 'Editar categoria' : 'Nova categoria' }}</h2></div>
        <form class="admin-form" @submit.prevent="salvar">
          <div class="admin-field">
            <label for="categoria-nome">Nome da categoria</label>
            <input id="categoria-nome" v-model="nome" type="text" maxlength="80" required placeholder="Ex.: Música" />
          </div>
          <div class="admin-form-actions">
            <button v-if="categoriaEditando" type="button" class="admin-button admin-button-light" @click="limparFormulario">Cancelar edição</button>
            <button type="submit" class="admin-button admin-button-primary" :disabled="salvando">
              {{ salvando ? 'Salvando...' : categoriaEditando ? 'Salvar alterações' : 'Cadastrar categoria' }}
            </button>
          </div>
        </form>
        <p class="admin-help-text">O nome da categoria deve ser único. Ela ficará disponível para novos eventos assim que for cadastrada.</p>
      </section>

      <section class="admin-panel">
        <div class="admin-panel-heading admin-panel-heading-row">
          <h2>Categorias cadastradas</h2>
          <span class="admin-counter">{{ categorias.length }}</span>
        </div>
        <div class="admin-field category-search">
          <label for="buscar-categoria">Buscar</label>
          <input id="buscar-categoria" v-model="busca" type="search" placeholder="Nome da categoria" />
        </div>
        <div v-if="carregando" class="admin-empty">Carregando categorias...</div>
        <div v-else-if="filtradas.length === 0" class="admin-empty">Nenhuma categoria encontrada.</div>
        <ul v-else class="admin-category-list">
          <li v-for="categoria in filtradas" :key="categoria.id">
            <div><strong>{{ categoria.nome }}</strong><small>ID {{ categoria.id }}</small></div>
            <div class="admin-row-actions">
              <button class="admin-button admin-button-light admin-button-small" @click="editar(categoria)">Editar</button>
              <button class="admin-button admin-button-danger-outline admin-button-small" @click="excluir(categoria)">Excluir</button>
            </div>
          </li>
        </ul>
      </section>
    </div>
  </section>
</template>
