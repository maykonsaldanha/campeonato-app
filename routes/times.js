const express = require('express')
const router = express.Router()
const db = require('../database/db')

router.get('/', (req, res) => {
  try {
    const times = db.prepare('SELECT * FROM times').all()
    res.json(times)
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar times' })
  }
})

router.get('/:id', (req, res) => {
  try {
    const time = db.prepare('SELECT * FROM times WHERE id = ?').get(req.params.id)
    if (!time) return res.status(404).json({ erro: 'Time não encontrado' })
    res.json(time)
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar time' })
  }
})

router.post('/', (req, res) => {
  try {
    const { nome, campeonato_id, responsavel } = req.body

    if (!nome || !campeonato_id) {
      return res.status(400).json({ erro: 'Nome e campeonato_id são obrigatórios' })
    }

    const campeonato = db.prepare('SELECT id FROM campeonatos WHERE id = ?').get(campeonato_id)
    if (!campeonato) return res.status(404).json({ erro: 'Campeonato não encontrado' })

    const resultado = db.prepare(`
      INSERT INTO times (nome, campeonato_id, responsavel)
      VALUES (?, ?, ?)
    `).run(nome, campeonato_id, responsavel ?? null)

    const novoTime = db.prepare('SELECT * FROM times WHERE id = ?').get(resultado.lastInsertRowid)
    res.status(201).json(novoTime)
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao cadastrar time' })
  }
})

router.put('/:id', (req, res) => {
  try {
    const { nome, responsavel } = req.body
    const { id } = req.params

    const time = db.prepare('SELECT * FROM times WHERE id = ?').get(id)
    if (!time) return res.status(404).json({ erro: 'Time não encontrado' })

    db.prepare(`
      UPDATE times SET
        nome        = ?,
        responsavel = ?
      WHERE id = ?
    `).run(nome ?? time.nome, responsavel ?? time.responsavel, id)

    const timeAtualizado = db.prepare('SELECT * FROM times WHERE id = ?').get(id)
    res.json(timeAtualizado)
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao atualizar time' })
  }
})

router.delete('/:id', (req, res) => {
  try {
    const time = db.prepare('SELECT * FROM times WHERE id = ?').get(req.params.id)
    if (!time) return res.status(404).json({ erro: 'Time não encontrado' })

    const jogosRelacionados = db.prepare(`
      SELECT id FROM jogos 
      WHERE time_casa_id = ? OR time_fora_id = ?
        `).all(req.params.id, req.params.id)

    if (jogosRelacionados.length > 0){
      return res.status(400).json({ erro: 'O time está relacionado a um jogo, não é permitido remover.'})
    } 

    db.prepare('DELETE FROM times WHERE id = ?').run(req.params.id)
    res.json({ mensagem: 'Time removido com sucesso' })
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao remover time' })
  }
})

module.exports = router