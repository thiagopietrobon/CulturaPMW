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
.localizacao-form {
  padding: 22px;
  border: 1px solid #e3ecf8;
  border-radius: 20px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  box-shadow: var(--shadow-sm);
  animation: cp-fade-up 0.5s var(--ease-out) backwards;
}

.localizacao-form-heading {
  display: flex;
  gap: 14px;
  margin-bottom: 18px;
}

.localizacao-form-heading::before {
  content: '';
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  border-radius: 13px;
  background:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z'/%3E%3Ccircle cx='12' cy='10' r='2.3'/%3E%3C/svg%3E") center / 20px no-repeat,
    var(--gradient-brand);
  box-shadow: 0 6px 14px rgb(8 66 140 / 24%);
}

.localizacao-eyebrow {
  margin: 0 0 4px;
  color: #1154d9;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.localizacao-form-heading h2 {
  margin: 0;
  color: #0d2342;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.015em;
}

.localizacao-form-heading p:last-child {
  margin: 4px 0 0;
  color: #5b7192;
  font-size: 13.5px;
  line-height: 1.5;
}

.localizacao-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.localizacao-field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 7px;
  color: #123d78;
  font-size: 13.5px;
  font-weight: 750;
}

.localizacao-field-full {
  grid-column: 1 / -1;
}

.localizacao-field input,
.localizacao-field select {
  width: 100%;
  min-height: 45px;
  padding: 10px 14px;
  border: 1.5px solid #d5e2f4;
  border-radius: 12px;
  outline: none;
  background: #fff;
  color: #123d78;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  transition: border-color var(--dur-fast) ease, box-shadow var(--dur-fast) ease;
}

.localizacao-field input:focus,
.localizacao-field select:focus {
  border-color: #1154d9;
  box-shadow: 0 0 0 3.5px rgb(17 84 217 / 13%);
}

.localizacao-field input:disabled,
.localizacao-field select:disabled {
  background: #eef3fa;
  color: #7c8fa9;
}

.localizacao-field small {
  color: #6f83a2;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.5;
}

.localizacao-opcional {
  color: #8497b3;
  font-weight: 500;
}

.localizacao-cep-row {
  display: flex;
  gap: 8px;
}

.localizacao-cep-row input {
  min-width: 0;
  flex: 1;
}

.localizacao-button {
  min-height: 45px;
  padding: 0 16px;
  border: 1.5px solid #bfd7f7;
  border-radius: 12px;
  background: #eef6ff;
  color: #08428c;
  font-size: 13.5px;
  font-weight: 800;
  white-space: nowrap;
  cursor: pointer;
  transition: transform var(--dur-fast) ease, background-color var(--dur-fast) ease, border-color var(--dur-fast) ease;
}

.localizacao-button:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: #117cd9;
  background: #e2efff;
}

.localizacao-button:disabled {
  cursor: wait;
  opacity: 0.6;
}

.localizacao-alert {
  margin-bottom: 14px;
  padding: 11px 14px;
  border: 1px solid transparent;
  border-radius: 12px;
  font-size: 13.5px;
  font-weight: 600;
  line-height: 1.5;
  animation: cp-fade-down 0.35s var(--ease-out) backwards;
}

.localizacao-alert-error {
  border-color: #f0b8b8;
  background: #fff5f5;
  color: #a32626;
  animation: cp-shake 0.45s ease backwards;
}

.localizacao-alert-info {
  border-color: #bfd7f7;
  background: #eef6ff;
  color: #08428c;
}

.localizacao-alert-success {
  border-color: #a8dfc0;
  background: #eefbf3;
  color: #136c3e;
}

@media (max-width: 620px) {
  .localizacao-form {
    padding: 16px;
  }

  .localizacao-grid {
    grid-template-columns: 1fr;
  }

  .localizacao-field-full {
    grid-column: auto;
  }

  .localizacao-cep-row {
    flex-direction: column;
  }
}

/* ===== TEMA ESCURO (gerado por scripts/gerar-tema-escuro.mjs — não editar este trecho) ===== */
html[data-theme='escuro'] .localizacao-form {
  border: 1px solid #203755;
  background-image: linear-gradient(180deg, #131b28 0%, #101d2f 100%);
  background-color: transparent;
  box-shadow: 0 2px 8px rgb(0 0 0 / 13.2%);
}

html[data-theme='escuro'] .localizacao-form-heading::before {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='#131b28' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z'/%3E%3Ccircle cx='12' cy='10' r='2.3'/%3E%3C/svg%3E"), linear-gradient(110deg, #117cd9 0%, #1154d9 58%, #08428c 100%);
  background-color: transparent;
  box-shadow: 0 6px 14px rgb(0 0 0 / 52.8%);
}

html[data-theme='escuro'] .localizacao-eyebrow {
  color: #88abf0;
}

html[data-theme='escuro'] .localizacao-form-heading h2 {
  color: #c5d9f4;
}

html[data-theme='escuro'] .localizacao-form-heading p:last-child {
  color: #acb8cb;
}

html[data-theme='escuro'] .localizacao-field {
  color: #aecbf3;
}

html[data-theme='escuro'] .localizacao-field input,
html[data-theme='escuro'] .localizacao-field select {
  border: 1.5px solid #233a5b;
  background-image: none;
  background-color: #131b28;
  color: #aecbf3;
}

html[data-theme='escuro'] .localizacao-field input:focus,
html[data-theme='escuro'] .localizacao-field select:focus {
  border-color: #1154d9;
  box-shadow: 0 0 0 3.5px rgb(17 84 217 / 13%);
}

html[data-theme='escuro'] .localizacao-field input:disabled,
html[data-theme='escuro'] .localizacao-field select:disabled {
  background-image: none;
  background-color: #122035;
  color: #9fadc0;
}

html[data-theme='escuro'] .localizacao-field small {
  color: #a4b0c4;
}

html[data-theme='escuro'] .localizacao-opcional {
  color: #98a8bf;
}

html[data-theme='escuro'] .localizacao-button {
  border: 1.5px solid #253f61;
  background-image: none;
  background-color: #112133;
  color: #a8c9f4;
}

html[data-theme='escuro'] .localizacao-button:hover:not(:disabled) {
  border-color: #117cd9;
  background-image: none;
  background-color: #132338;
}

html[data-theme='escuro'] .localizacao-alert-error {
  border-color: #662727;
  background-image: none;
  background-color: #301010;
  color: #e89e9e;
}

html[data-theme='escuro'] .localizacao-alert-info {
  border-color: #253f61;
  background-image: none;
  background-color: #112133;
  color: #a8c9f4;
}

html[data-theme='escuro'] .localizacao-alert-success {
  border-color: #2b7149;
  background-image: none;
  background-color: #12351f;
  color: #b3f2d1;
}
/* ===== FIM DO TEMA ESCURO GERADO ===== */
</style>
