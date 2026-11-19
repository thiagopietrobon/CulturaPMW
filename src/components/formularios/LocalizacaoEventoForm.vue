<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import type { Regiao } from '../../models/Regiao'
import { servicoCEP } from '../../services/ServicoCEP'
import {
  localizacaoService,
  type DadosLocalizacaoEvento
} from '../../services/LocalizacaoService'

const props = withDefaults(defineProps<{
  modelValue: DadosLocalizacaoEvento
  disabled?: boolean
}>(), {
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: DadosLocalizacaoEvento]
}>()

const formulario = reactive<DadosLocalizacaoEvento>({ ...props.modelValue })
const regioes = ref<Regiao[]>([])
const carregandoRegioes = ref(true)
const consultandoCep = ref(false)
const erro = ref('')
const aviso = ref('')
const sucesso = ref('')
let regiaoSugeridaAutomaticamente: number | null = null

watch(() => props.modelValue, (valor) => {
  Object.assign(formulario, valor)
}, { deep: true })

watch(formulario, (valor) => {
  emit('update:modelValue', { ...valor })
}, { deep: true })

async function carregarRegioes() {
  carregandoRegioes.value = true
  erro.value = ''
  try {
    regioes.value = await localizacaoService.listarRegioes()
    if (regioes.value.length === 0) {
      erro.value = 'Nenhuma região foi cadastrada. Solicite à administração a configuração das regiões de Palmas.'
    }
  } catch (error) {
    console.error('[CulturaPMW] Falha ao carregar regiões:', error)
    erro.value = 'Não foi possível carregar as regiões. Tente novamente.'
  } finally {
    carregandoRegioes.value = false
  }
}

async function consultarCep() {
  erro.value = ''
  aviso.value = ''
  sucesso.value = ''
  consultandoCep.value = true

  try {
    const endereco = await servicoCEP.consultarEndereco(formulario.cep)
    if (!endereco) {
      erro.value = 'CEP não encontrado. Confira o número ou preencha o endereço manualmente.'
      return
    }

    formulario.cep = endereco.cep
    formulario.logradouro = endereco.logradouro
    formulario.complemento = formulario.complemento || endereco.complemento
    formulario.bairro = endereco.bairro
    formulario.cidade = endereco.cidade
    formulario.uf = endereco.uf.toUpperCase()

    if (formulario.cidade.toLocaleLowerCase('pt-BR') !== 'palmas' || formulario.uf !== 'TO') {
      formulario.regiao_id = null
      regiaoSugeridaAutomaticamente = null
      aviso.value = 'O CEP informado não corresponde a Palmas-TO. O evento precisa estar localizado em Palmas.'
      return
    }

    const regiao = localizacaoService.identificarRegiao(endereco, regioes.value)
    if (regiao) {
      formulario.regiao_id = regiao.id
      regiaoSugeridaAutomaticamente = regiao.id
      sucesso.value = `Endereço localizado. Região sugerida: ${regiao.nome}. Confira antes de continuar.`
    } else {
      formulario.regiao_id = null
      regiaoSugeridaAutomaticamente = null
      aviso.value = 'Endereço localizado. Não foi possível identificar a região automaticamente; selecione uma região manualmente.'
    }
  } catch (error) {
    erro.value = error instanceof Error
      ? error.message
      : 'Não foi possível consultar o CEP. Preencha o endereço manualmente.'
  } finally {
    consultandoCep.value = false
  }
}

function selecionarRegiao(event: Event) {
  const valor = (event.target as HTMLSelectElement).value
  formulario.regiao_id = valor ? Number(valor) : null
  regiaoSugeridaAutomaticamente = null
  sucesso.value = ''
  aviso.value = ''
}

function alterarEnderecoManual() {
  if (regiaoSugeridaAutomaticamente !== null && formulario.regiao_id === regiaoSugeridaAutomaticamente) {
    formulario.regiao_id = null
  }
  regiaoSugeridaAutomaticamente = null
  limparMensagens()
}

function limparMensagens() {
  erro.value = ''
  aviso.value = ''
  sucesso.value = ''
}

onMounted(carregarRegioes)

defineExpose({
  validar: () => localizacaoService.validarDados(formulario),
  obterDados: () => ({ ...formulario })
})
</script>

<template>
  <section class="localizacao-form" aria-labelledby="localizacao-titulo">
    <header class="localizacao-form-heading">
      <div>
        <p class="localizacao-eyebrow">LOCAL DO EVENTO</p>
        <h2 id="localizacao-titulo">Localização</h2>
        <p>Informe o endereço em Palmas-TO. A consulta por CEP é opcional; você também pode preencher tudo manualmente.</p>
      </div>
    </header>

    <div v-if="erro" class="localizacao-alert localizacao-alert-error" role="alert">{{ erro }}</div>
    <div v-if="aviso" class="localizacao-alert localizacao-alert-info" role="status">{{ aviso }}</div>
    <div v-if="sucesso" class="localizacao-alert localizacao-alert-success" role="status">{{ sucesso }}</div>

    <div class="localizacao-grid">
      <div class="localizacao-field localizacao-field-cep">
        <label for="evento-cep">CEP <span class="localizacao-opcional">(opcional)</span></label>
        <div class="localizacao-cep-row">
          <input
            id="evento-cep"
            v-model="formulario.cep"
            type="text"
            inputmode="numeric"
            autocomplete="postal-code"
            maxlength="9"
            placeholder="77000-000"
            :disabled="disabled"
            @input="alterarEnderecoManual"
          />
          <button
            type="button"
            class="localizacao-button"
            :disabled="disabled || consultandoCep || carregandoRegioes"
            @click="consultarCep"
          >
            {{ consultandoCep ? 'Consultando...' : 'Consultar CEP' }}
          </button>
        </div>
        <small>Se a consulta não funcionar, continue preenchendo os campos abaixo.</small>
      </div>

      <div class="localizacao-field localizacao-field-full">
        <label for="evento-logradouro">Logradouro *</label>
        <input id="evento-logradouro" v-model="formulario.logradouro" required maxlength="180" placeholder="Rua, avenida, quadra..." :disabled="disabled" @input="alterarEnderecoManual" />
      </div>

      <div class="localizacao-field">
        <label for="evento-numero">Número</label>
        <input id="evento-numero" v-model="formulario.numero" maxlength="30" placeholder="Número ou S/N" :disabled="disabled" />
      </div>

      <div class="localizacao-field">
        <label for="evento-complemento">Complemento</label>
        <input id="evento-complemento" v-model="formulario.complemento" maxlength="100" placeholder="Bloco, sala, referência..." :disabled="disabled" />
      </div>

      <div class="localizacao-field">
        <label for="evento-bairro">Bairro *</label>
        <input id="evento-bairro" v-model="formulario.bairro" required maxlength="100" placeholder="Bairro" :disabled="disabled" @input="alterarEnderecoManual" />
      </div>

      <div class="localizacao-field">
        <label for="evento-cidade">Cidade</label>
        <input id="evento-cidade" v-model="formulario.cidade" readonly disabled />
      </div>

      <div class="localizacao-field">
        <label for="evento-uf">Estado</label>
        <input id="evento-uf" v-model="formulario.uf" readonly disabled />
      </div>

      <div class="localizacao-field localizacao-field-full">
        <label for="evento-regiao">Região de Palmas *</label>
        <select
          id="evento-regiao"
          :value="formulario.regiao_id ?? ''"
          required
          :disabled="disabled || carregandoRegioes || regioes.length === 0"
          @change="selecionarRegiao"
        >
          <option value="">Selecione a região do evento</option>
          <option v-for="regiao in regioes" :key="regiao.id" :value="regiao.id">{{ regiao.nome }}</option>
        </select>
        <small v-if="!carregandoRegioes">Confirme a sugestão automática ou selecione manualmente a região correspondente.</small>
        <small v-else>Carregando regiões...</small>
      </div>
    </div>
  </section>
</template>

<style scoped>
.localizacao-form{padding:20px;border:1px solid #e1e7ef;border-radius:12px;background:#fff}
.localizacao-form-heading{margin-bottom:18px}
.localizacao-eyebrow{margin:0 0 6px;color:var(--color-primary);font-size:10px;font-weight:800;letter-spacing:1px}
.localizacao-form-heading h2{margin:0;color:#172b49;font-size:19px}
.localizacao-form-heading p:last-child{margin:7px 0 0;color:#68768b;font-size:12px;line-height:1.6}
.localizacao-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.localizacao-field{display:flex;min-width:0;flex-direction:column;gap:6px;color:#43536b;font-size:12px;font-weight:700}
.localizacao-field-full{grid-column:1/-1}
.localizacao-field input,.localizacao-field select{width:100%;min-height:42px;padding:9px 11px;border:1px solid #dce3ed;border-radius:7px;background:#fff;color:#172b49;font-family:inherit;font-size:13px;font-weight:400;outline:none}
.localizacao-field input:focus,.localizacao-field select:focus{border-color:#4e86df;box-shadow:0 0 0 3px rgba(29,100,216,.1)}
.localizacao-field input:disabled,.localizacao-field select:disabled{background:#f6f8fb;color:#64748b}
.localizacao-field small{color:#738096;font-size:10px;font-weight:400;line-height:1.5}
.localizacao-opcional{color:#8491a3;font-weight:400}
.localizacao-cep-row{display:flex;gap:8px}
.localizacao-cep-row input{flex:1;min-width:0}
.localizacao-button{padding:9px 13px;border:1px solid #dce3ed;border-radius:7px;background:#f6f8fb;color:#24558d;font-size:11px;font-weight:800;white-space:nowrap;cursor:pointer}
.localizacao-button:disabled{opacity:.6;cursor:wait}
.localizacao-alert{margin-bottom:12px;padding:10px 12px;border:1px solid transparent;border-radius:7px;font-size:11px;line-height:1.55}
.localizacao-alert-error{border-color:#f0c7ca;background:#fff4f4;color:#a72e38}
.localizacao-alert-info{border-color:#c9def8;background:#f1f7ff;color:#24558d}
.localizacao-alert-success{border-color:#bde6ce;background:#effaf3;color:#176b43}
@media(max-width:620px){.localizacao-form{padding:16px}.localizacao-grid{grid-template-columns:1fr}.localizacao-field-full{grid-column:auto}.localizacao-cep-row{flex-direction:column}.localizacao-button{min-height:40px}}
</style>
