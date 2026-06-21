const express = require('express')
const router = express.Router()
const db = require('../database/db')

router.get('/', (req, res) => {
    try {
        const campeonatos = db.prepare('SELECT * FROM campeonatos').all()
        res.json(campeonatos)
    } catch (error){
        res.status(500).json({erro: 'Erro ao buscar campeonatos'})
    }
})

router.get('/:id', (req, res) => {
    try {
        const campeonato = db.prepare('SELECT * FROM campeonatos WHERE id = ?').get(req.params.id)
        if (!campeonato) return res.status(404).json({erro: 'Campeonato não encontrado'})
        res.json(campeonato)
    } catch (error) {
        res.status(500).json({erro: 'Erro na busca do campeonato'})
    }
})

router.post('/', (req, res) => {
    try {
        const {nome, modalidade} = req.body

        if (!nome || !modalidade) {
            return res.status(400).json({erro: 'Nome e modalidade são informações obrigatórias'})
        }
        
        const resultado = db.prepare(`
            INSERT INTO campeonatos (nome, modalidade)
            VALUES (?, ?)
            `).run(nome, modalidade)
        
        const novoCampeonato = db.prepare('SELECT * FROM campeonatos WHERE id = ?').get(resultado.lastInsertRowid)
        res.status(201).json(novoCampeonato)
    } catch (error) {
        res.status(500).json({erro: 'Erro ao cadastrar campeonato'})
    }
})

router.put('/:id', (req,res) => {
    try {
        const { nome, modalidade } = req.body
        const { id } = req.params

        const campeonato = db.prepare('SELECT * FROM campeonatos WHERE id = ?').get(id)
        if (!campeonato) return res.status(404).json({erro: 'Campeonato não encontrado'})
        
        db.prepare(`
            UPDATE campeonatos SET 
                nome = ?,
                modalidade = ?
            WHERE id = ?
        `).run(nome ?? campeonato.nome, modalidade ?? campeonato.modalidade, id )

        const campeonatoAtualizado = db.prepare('SELECT * FROM campeonatos WHERE id = ?').get(id)
        res.json(campeonatoAtualizado)
    } catch (error) {
        res.status(500).json({erro: 'Erro ao atualizar campeonato'})
    }
})

router.delete('/:id', (req, res) => {
    try {
        const campeonato = db.prepare('SELECT * FROM campeonatos WHERE id = ?').get(req.params.id)
        if(!campeonato) return res.status(404).json({erro: 'Campeonato não encontrado'})

        const campeonatoRelacionado = db.prepare(`
            SELECT id FROM jogos WHERE campeonato_id = ?
            `).all(req.params.id) //retorno de .all() sempre é um array

        if (campeonatoRelacionado.length > 0){
            return res.status(400).json({ erro: 'Campeonato relacionado a um jogo, não é possível remover.'})
        } 
        
        db.prepare('DELETE FROM campeonatos WHERE id = ?').run(req.params.id)
        res.json({mensagem: "Campeonato removido com sucesso"})
    } catch (error) {
        res.status(500).json({erro: 'Erro ao remover campeonato'})
    }
})

module.exports = router