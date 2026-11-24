<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";
import { useRouter } from "vue-router";
import { authService } from "../../services/AuthService";
import logoCulturaPMW from "../../assets/svg/culturapmw-logo.png";
import "../../assets/styles/auth-senha.css";

const router = useRouter();
const senha = ref("");
const confirmarSenha = ref("");
const erro = ref("");
const sucesso = ref("");
const carregando = ref(false);
const mostrarSenha = ref(false);
const mostrarConfirmacao = ref(false);

let temporizadorRedirecionamento: number | undefined;

onBeforeUnmount(() => {
  if (temporizadorRedirecionamento !== undefined) {
    window.clearTimeout(temporizadorRedirecionamento);
  }
});

async function salvar() {
  erro.value = "";
  sucesso.value = "";

  if (senha.value.length < 8) {
    erro.value = "A nova senha deve ter pelo menos 8 caracteres.";
    return;
  }

  if (senha.value !== confirmarSenha.value) {
    erro.value = "As senhas informadas não são iguais.";
    return;
  }

  carregando.value = true;

  try {
    await authService.atualizarSenha(senha.value);
    sucesso.value =
      "Sua senha foi atualizada. Você já pode entrar na plataforma.";
    senha.value = "";
    confirmarSenha.value = "";

    // O encerramento da sessão é desejável, mas não deve ocultar o sucesso
    // caso a atualização da senha já tenha sido concluída no Supabase.
    try {
      await authService.sair();
    } catch (erroAoSair) {
      console.warn(
        "A senha foi atualizada, mas não foi possível encerrar a sessão:",
        erroAoSair,
      );
    }

    temporizadorRedirecionamento = window.setTimeout(() => {
      void router.replace({ name: "login" });
    }, 1400);
  } catch (error) {
    console.error(error);
    erro.value =
      error instanceof Error
        ? error.message
        : "Não foi possível atualizar a senha. Solicite um novo link.";
  } finally {
    carregando.value = false;
  }
}
</script>

<template>
  <main class="senha-auth-page">
    <section class="senha-auth-card" aria-labelledby="redefinir-senha-titulo">
      <RouterLink
        to="/"
        class="senha-auth-logo-link"
        aria-label="CulturaPMW — voltar ao início"
      >
        <img
          class="senha-auth-logo"
          :src="logoCulturaPMW"
          alt="CulturaPMW — Eventos que conectam Palmas"
          width="560"
          height="163"
        />
      </RouterLink>

      <hr class="senha-auth-divider" />

      <header class="senha-auth-heading">
        <span class="senha-auth-eyebrow">NOVA SENHA</span>
        <h1 id="redefinir-senha-titulo">Redefinir senha</h1>
        <p>Escolha uma nova senha para acessar sua conta do CulturaPMW.</p>
      </header>

      <div
        v-if="sucesso"
        class="senha-auth-alert senha-auth-alert-success"
        role="status"
        aria-live="polite"
      >
        <strong>Senha atualizada com sucesso!</strong>
        <p>{{ sucesso }} Redirecionando para a tela de entrada...</p>
      </div>

      <form v-else class="senha-auth-form" @submit.prevent="salvar">
        <div class="senha-auth-field">
          <label for="nova-senha">Nova senha</label>
          <div
            class="senha-auth-input-wrap"
            :class="{ 'is-invalid': Boolean(erro) }"
          >
            <input
              id="nova-senha"
              v-model="senha"
              :type="mostrarSenha ? 'text' : 'password'"
              name="nova-senha"
              minlength="8"
              autocomplete="new-password"
              required
              placeholder="Digite sua nova senha"
              :aria-invalid="Boolean(erro)"
              aria-describedby="senha-requisito"
            />
            <button
              class="senha-auth-password-toggle"
              type="button"
              :aria-label="
                mostrarSenha ? 'Ocultar nova senha' : 'Mostrar nova senha'
              "
              :aria-pressed="mostrarSenha"
              @click="mostrarSenha = !mostrarSenha"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <template v-if="mostrarSenha">
                  <path d="M3 3l18 18" />
                  <path d="M10.6 10.6a2 2 0 002.8 2.8" />
                  <path
                    d="M9.9 5.2A10.8 10.8 0 0112 5c5 0 8.5 4.5 9.5 7-.4 1-1.2 2.1-2.3 3.1"
                  />
                  <path
                    d="M6.2 6.2C3.9 7.6 2.8 9.4 2.5 12c.6 1.5 3.8 7 9.5 7 1.2 0 2.3-.2 3.3-.7"
                  />
                </template>
                <template v-else>
                  <path
                    d="M2.5 12s3.2-7 9.5-7 9.5 7 9.5 7-3.2 7-9.5 7-9.5-7-9.5-7z"
                  />
                  <circle cx="12" cy="12" r="3" />
                </template>
              </svg>
            </button>
          </div>
          <small id="senha-requisito" class="senha-auth-hint"
            >Use pelo menos 8 caracteres.</small
          >
        </div>

        <div class="senha-auth-field">
          <label for="confirmar-nova-senha">Confirmar nova senha</label>
          <div
            class="senha-auth-input-wrap"
            :class="{ 'is-invalid': Boolean(erro) }"
          >
            <input
              id="confirmar-nova-senha"
              v-model="confirmarSenha"
              :type="mostrarConfirmacao ? 'text' : 'password'"
              name="confirmar-nova-senha"
              minlength="8"
              autocomplete="new-password"
              required
              placeholder="Digite novamente a nova senha"
              :aria-invalid="Boolean(erro)"
            />
            <button
              class="senha-auth-password-toggle"
              type="button"
              :aria-label="
                mostrarConfirmacao
                  ? 'Ocultar confirmação da senha'
                  : 'Mostrar confirmação da senha'
              "
              :aria-pressed="mostrarConfirmacao"
              @click="mostrarConfirmacao = !mostrarConfirmacao"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <template v-if="mostrarConfirmacao">
                  <path d="M3 3l18 18" />
                  <path d="M10.6 10.6a2 2 0 002.8 2.8" />
                  <path
                    d="M9.9 5.2A10.8 10.8 0 0112 5c5 0 8.5 4.5 9.5 7-.4 1-1.2 2.1-2.3 3.1"
                  />
                  <path
                    d="M6.2 6.2C3.9 7.6 2.8 9.4 2.5 12c.6 1.5 3.8 7 9.5 7 1.2 0 2.3-.2 3.3-.7"
                  />
                </template>
                <template v-else>
                  <path
                    d="M2.5 12s3.2-7 9.5-7 9.5 7 9.5 7-3.2 7-9.5 7-9.5-7-9.5-7z"
                  />
                  <circle cx="12" cy="12" r="3" />
                </template>
              </svg>
            </button>
          </div>
        </div>

        <p
          v-if="erro"
          class="senha-auth-alert senha-auth-alert-error"
          role="alert"
        >
          {{ erro }}
        </p>

        <button class="senha-auth-submit" type="submit" :disabled="carregando">
          {{ carregando ? "Salvando senha..." : "Salvar nova senha" }}
        </button>
      </form>

      <footer class="cadastro-footer" aria-label="Navegação">
        <RouterLink to="/login" class="cadastro-footer-action cadastro-login-action">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M10 17l5-5-5-5M15 12H3" />
            <path d="M13 4h5a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-5" />
          </svg>
          <span>
            <strong>Já possui cadastro?</strong>
            <small>Entrar na plataforma</small>
          </span>
        </RouterLink>

        <RouterLink to="/" class="cadastro-footer-action cadastro-home-action">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m3 10 9-7 9 7" />
            <path d="M5 9v11h14V9M9 20v-6h6v6" />
          </svg>
          <span>
            <strong>Voltar para a agenda</strong>
            <small>Ver eventos do CulturaPMW</small>
          </span>
        </RouterLink>
      </footer>
    </section>
  </main>
</template>
