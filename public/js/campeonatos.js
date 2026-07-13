const lista = document.getElementById('lista')
const vazio = document.getElementById('vazio')
const erro = document.getElementById('erro')
const modalOverlay = document.getElementById('modal-overlay')
const modalTitulo = document.getElementById('modal-titulo')
const inputNome = document.getElementById('input-nome')
const inputModalidade = document.getElementById('input-modalidade')
const btnNovo = document.getElementById('btn-novo')
const btnCancelar = document.getElementById('btn-cancelar')
const btnSalvar = document.getElementById('btn-salvar')

let campeonatoEditandoId = null

async function carregarCampeonatos() {
  try {
    const resposta = await fetch('/api/campeonatos')
    const campeonatos = await resposta.json()

    lista.innerHTML = ''
    mostrarErro(null)

    if (campeonatos.length === 0) {
      vazio.style.display = 'block'
      return
    }

    vazio.style.display = 'none'
    campeonatos.forEach(c => lista.appendChild(criarCard(c)))
  } catch (e) {
    mostrarErro('Não foi possível conectar ao servidor.')
  }
}

function criarCard(campeonato) {
  const card = document.createElement('div')
  card.className = 'card-campeonato'

  card.innerHTML = `
    <div class="info">
      <h3>${campeonato.nome}</h3>
      <div class="meta">
        <span class="badge badge-modalidade">${campeonato.modalidade}</span>
        <span class="badge ${campeonato.status === 'ativo' ? 'badge-ativo' : 'badge-encerrado'}">
          ${campeonato.status}
        </span>
      </div>
    </div>
    <div class="acoes">
      <button class="secundario" data-id="${campeonato.id}" data-nome="${campeonato.nome}" data-modalidade="${campeonato.modalidade}">
        Editar
      </button>
    </div>
  `

  card.querySelector('button').addEventListener('click', (e) => {
    e.stopPropagation()
    const btn = e.currentTarget
    abrirModalEdicao(btn.dataset.id, btn.dataset.nome, btn.dataset.modalidade)
  })

  return card
}

function abrirModalCriacao() {
  campeonatoEditandoId = null
  modalTitulo.textContent = 'Novo Campeonato'
  inputNome.value = ''
  inputModalidade.value = 'fut7'
  modalOverlay.classList.add('aberto')
  inputNome.focus()
}

function abrirModalEdicao(id, nome, modalidade) {
  campeonatoEditandoId = id
  modalTitulo.textContent = 'Editar Campeonato'
  inputNome.value = nome
  inputModalidade.value = modalidade
  modalOverlay.classList.add('aberto')
  inputNome.focus()
}

function fecharModal() {
  modalOverlay.classList.remove('aberto')
  campeonatoEditandoId = null
}

async function salvarCampeonato() {
  const nome = inputNome.value.trim()
  const modalidade = inputModalidade.value

  if (!nome) {
    inputNome.focus()
    return
  }

  btnSalvar.disabled = true
  btnSalvar.textContent = 'Salvando...'

  try {
    const url = campeonatoEditandoId
      ? `/api/campeonatos/${campeonatoEditandoId}`
      : '/api/campeonatos'

    const metodo = campeonatoEditandoId ? 'PUT' : 'POST'

    const resposta = await fetch(url, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, modalidade })
    })

    if (!resposta.ok) {
      const dados = await resposta.json()
      mostrarErro(dados.erro || 'Erro ao salvar campeonato.')
      return
    }

    fecharModal()
    await carregarCampeonatos()
  } catch (e) {
    mostrarErro('Não foi possível conectar ao servidor.')
  } finally {
    btnSalvar.disabled = false
    btnSalvar.textContent = 'Salvar'
  }
}

function mostrarErro(mensagem) {
  if (!mensagem) {
    erro.style.display = 'none'
    erro.textContent = ''
    return
  }
  erro.style.display = 'block'
  erro.textContent = mensagem
}

btnNovo.addEventListener('click', abrirModalCriacao)
btnCancelar.addEventListener('click', fecharModal)
btnSalvar.addEventListener('click', salvarCampeonato)

modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) fecharModal()
})

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') fecharModal()
})

carregarCampeonatos()