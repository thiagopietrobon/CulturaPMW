# CulturaPMW — RF03, RF04 e RF05: área pública

## Escopo implementado

### RF03 — Visualizar feed

- A agenda consulta `vw_eventos_publicos`, que já aplica as regras de aprovação do produtor, suspensão, ocultação e expiração após 24 horas.
- A listagem é ordenada por `data_inicio` em ordem crescente.
- Os atalhos permitem consultar todos os eventos, eventos cuja data de início é hoje e eventos com início no sábado ou domingo do final de semana corrente/próximo.
- O intervalo de datas usa limite final exclusivo para não perder eventos nos últimos milissegundos do dia.
- A tela possui estados de carregamento, erro, ausência de resultados, nova tentativa e limpeza dos filtros.

### RF04 — Pesquisar e filtrar eventos

- A pesquisa considera título, descrição, bairro, logradouro, categoria, região e nome do produtor.
- A expressão enviada ao filtro `or` do PostgREST coloca o termo em valor entre aspas e escapa barras invertidas/aspas.
- Categorias e regiões permitem selecionar uma ou mais opções ao mesmo tempo.
- O filtro de gratuidade diferencia todos, gratuitos e pagos.
- Os filtros podem ser combinados; a consulta continua sendo feita na view pública.
- A tela informa quando não há resultados e oferece limpeza dos filtros.

### RF05 — Visualizar detalhes

- Os detalhes são consultados por ID exclusivamente em `vw_eventos_publicos`.
- Links externos são carregados somente depois que o evento é encontrado na view pública.
- A tela apresenta título, imagem, categoria, região, datas, valor, endereço, links de mapa, descrição, links externos e produtor.
- Eventos inexistentes, ocultos ou expirados apresentam conteúdo indisponível.
- Falhas temporárias de consulta apresentam erro e opção de tentar novamente.
- A tela recarrega os dados quando o parâmetro de rota muda sem desmontar o componente.

### Perfil público do produtor (UC 5.3)

- Consulta os dados pela view `vw_produtores_publicos`, sem expor e-mail ou CPF/CNPJ.
- Lista apenas os eventos do produtor que continuam disponíveis na view pública.
- Possui estados distintos para carregamento, erro, perfil indisponível e ausência de eventos.
- Recarrega corretamente quando o ID do produtor muda na rota.

## Arquivos envolvidos

- `src/services/EventoService.ts`
- `src/components/eventos/EventosFiltros.vue`
- `src/views/public/HomeView.vue`
- `src/views/public/EventoDetalhesView.vue`
- `src/views/public/ProdutorPerfilView.vue`
- `plano_de_desenvolvimento_culturapmw.md`

## Banco de dados

Não foi criada nova migration para RF03, RF04 ou RF05. As telas utilizam as views e tabelas configuradas pelas migrations anteriores:

- `vw_eventos_publicos`
- `vw_produtores_publicos`
- `categorias`
- `regioes`
- `links_externos`

A view pública deve estar atualizada pela migration RF09 para aplicar a retirada após 24 horas.

## Checklist de validação integrada

1. Abrir a agenda sem filtros e confirmar a ordem cronológica.
2. Consultar eventos de hoje e do final de semana.
3. Pesquisar por parte do título, descrição, bairro, categoria, região e produtor.
4. Selecionar duas ou mais categorias e duas ou mais regiões e confirmar a combinação dos filtros.
5. Combinar pesquisa, período, categoria, região e gratuidade.
6. Limpar os filtros e confirmar o retorno à agenda completa.
7. Abrir os detalhes de um evento disponível e testar todos os links.
8. Abrir o perfil público do produtor e conferir seus eventos disponíveis.
9. Abrir um evento inexistente, oculto e expirado para confirmar a mensagem de indisponibilidade.
10. Navegar de um evento para outro e de um perfil de produtor para outro sem recarregar manualmente a página.

## Situação dos testes

- `vue-tsc -b`: validado sem erros neste ambiente.
- `vite build`: não confirmado neste ambiente porque o pacote nativo opcional do Rolldown para Linux não está instalado.
- Testes de integração com Supabase: pendentes no ambiente do projeto.
