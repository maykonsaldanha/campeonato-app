const express = require('express')
const router = express.Router()
const db = require('../database/db')

router.post('/', (req, res) => {
    try {
        const {
            campeonato_id,
            time_casa_id,
            time_fora_id,
            data_jogo
        } = req.body

        if (!campeonato_id || !time_casa_id || !time_fora_id || !data_jogo) {
            return res.status(400).json({
                erro: 'campeonato_id, time_casa_id, time_fora_id e data_jogo são obrigatórios'
            })
        }

        if (time_casa_id === time_fora_id) {
            return res.status(400).json({
                erro: 'Um time não pode jogar contra si mesmo'
            })
        }

        const campeonato = db.prepare('SELECT id FROM campeonatos WHERE id = ?').get(campeonato_id)
        if (!campeonato) return res.status(404).json({
            erro: 'Campeonato não encontrado'
        })

        const timeCasa = db.prepare('SELECT id FROM times WHERE id = ? AND campeonato_id = ?').get(time_casa_id, campeonato_id)
        if (!timeCasa) return res.status(404).json({
            erro: 'Time da casa não encontrado neste campeonato'
        })

        const timeFora = db.prepare('SELECT id FROM times WHERE id = ? AND campeonato_id = ?').get(time_fora_id, campeonato_id)
        if (!timeFora) return res.status(404).json({
            erro: 'Time visitante não encontrado neste campeonato'
        })

        const resultado = db.prepare(`
      INSERT INTO jogos (campeonato_id, time_casa_id, time_fora_id, data_jogo)
      VALUES (?, ?, ?, ?)
    `).run(campeonato_id, time_casa_id, time_fora_id, data_jogo)

        const novoJogo = db.prepare('SELECT * FROM jogos WHERE id = ?').get(resultado.lastInsertRowid)
        res.status(201).json(novoJogo)
    } catch (error) {
        res.status(500).json({
            erro: 'Erro ao agendar jogo'
        })
    }
})

router.get('/', (req, res) => {
    try {
        const jogos = db.prepare(`
      SELECT
        j.id,
        j.data_jogo,
        j.status,
        j.gols_casa,
        j.gols_fora,
        tc.nome AS time_casa,
        tf.nome AS time_fora,
        c.nome  AS campeonato
      FROM jogos j
      JOIN times tc ON tc.id = j.time_casa_id
      JOIN times tf ON tf.id = j.time_fora_id
      JOIN campeonatos c ON c.id = j.campeonato_id
    `).all()
        res.json(jogos)
    } catch (error) {
        res.status(500).json({
            erro: 'Erro ao buscar jogos'
        })
    }
})

router.get('/campeonato/:campeonato_id', (req, res) => {
    try {
        const campeonato = db.prepare('SELECT id FROM campeonatos WHERE id = ?').get(req.params.campeonato_id)
        if (!campeonato) return res.status(404).json({
            erro: 'Campeonato não encontrado'
        })

        const jogos = db.prepare(`
      SELECT
        j.id,
        j.data_jogo,
        j.status,
        j.gols_casa,
        j.gols_fora,
        tc.nome AS time_casa,
        tf.nome AS time_fora
      FROM jogos j
      JOIN times tc ON tc.id = j.time_casa_id
      JOIN times tf ON tf.id = j.time_fora_id
      WHERE j.campeonato_id = ?
      ORDER BY j.data_jogo ASC
    `).all(req.params.campeonato_id)
        res.json(jogos)
    } catch (error) {
        res.status(500).json({
            erro: 'Erro ao buscar jogos do campeonato'
        })
    }
})

router.get('/busca/por-data', (req, res) => {
    try {
        const {
            data_inicio,
            data_fim,
            campeonato_id
        } = req.query

        if (!data_inicio) {
            return res.status(400).json({
                erro: 'data_inicio é obrigatória'
            })
        }

        const dataInicioValida = !isNaN(Date.parse(data_inicio))
        const dataFimValida = data_fim ? !isNaN(Date.parse(data_fim)) : true

        if (!dataInicioValida || !dataFimValida) {
            return res.status(400).json({
                erro: 'Formato de data inválido, use YYYY-MM-DD'
            })
        }

        let query = `
      SELECT
        j.id,
        j.data_jogo,
        j.status,
        j.gols_casa,
        j.gols_fora,
        tc.nome AS time_casa,
        tf.nome AS time_fora,
        c.nome  AS campeonato
      FROM jogos j
      JOIN times tc ON tc.id = j.time_casa_id
      JOIN times tf ON tf.id = j.time_fora_id
      JOIN campeonatos c ON c.id = j.campeonato_id
      WHERE j.data_jogo = ?
    `

        const params = [data_inicio]

        if (data_fim) {
            query += ` AND j.data_jogo <= ?`
            params.push(data_fim)
        }

        if (campeonato_id) {
            query += ` AND j.campeonato_id = ?`
            params.push(campeonato_id)
        }

        query += ` ORDER BY j.data_jogo ASC`

        const jogos = db.prepare(query).all(...params)
        res.json(jogos)
    } catch (error) {
        res.status(500).json({
            erro: 'Erro ao buscar jogos por data'
        })
    }
})

router.get('/:id', (req, res) => {
    try {
        const jogo = db.prepare(`
      SELECT
        j.id,
        j.data_jogo,
        j.status,
        j.gols_casa,
        j.gols_fora,
        tc.nome AS time_casa,
        tf.nome AS time_fora,
        c.nome  AS campeonato
      FROM jogos j
      JOIN times tc ON tc.id = j.time_casa_id
      JOIN times tf ON tf.id = j.time_fora_id
      JOIN campeonatos c ON c.id = j.campeonato_id
      WHERE j.id = ?
    `).get(req.params.id)

        if (!jogo) return res.status(404).json({
            erro: 'Jogo não encontrado'
        })
        res.json(jogo)
    } catch (error) {
        res.status(500).json({
            erro: 'Erro ao buscar jogo'
        })
    }
})

router.put('/:id/placar', (req, res) => {
    try {
        const {
            gols_casa,
            gols_fora
        } = req.body
        const {
            id
        } = req.params

        if (gols_casa === undefined || gols_fora === undefined) {
            return res.status(400).json({
                erro: 'gols_casa e gols_fora são obrigatórios'
            })
        }

        if (gols_casa < 0 || gols_fora < 0) {
            return res.status(400).json({
                erro: 'Gols não podem ser negativos'
            })
        }

        const jogo = db.prepare('SELECT * FROM jogos WHERE id = ?').get(id)
        if (!jogo) return res.status(404).json({
            erro: 'Jogo não encontrado'
        })

        if (jogo.status === 'encerrado') {
            return res.status(400).json({
                erro: 'Este jogo já foi encerrado'
            })
        }

        db.prepare(`
      UPDATE jogos SET
        gols_casa = ?,
        gols_fora = ?,
        status    = 'encerrado'
      WHERE id = ?
    `).run(gols_casa, gols_fora, id)

        const jogoAtualizado = db.prepare('SELECT * FROM jogos WHERE id = ?').get(id)
        res.json(jogoAtualizado)
    } catch (error) {
        res.status(500).json({
            erro: 'Erro ao registrar placar'
        })
    }
})

router.get('/campeonato/:campeonato_id/classificacao', (req, res) => {
    try {
        const campeonato = db.prepare('SELECT id FROM campeonatos WHERE id = ?').get(req.params.campeonato_id)
        if (!campeonato) return res.status(404).json({
            erro: 'Campeonato não encontrado'
        })

        const times = db.prepare('SELECT id, nome FROM times WHERE campeonato_id = ?').all(req.params.campeonato_id)

        const jogos = db.prepare(`
      SELECT * FROM jogos
      WHERE campeonato_id = ? AND status = 'encerrado'
    `).all(req.params.campeonato_id)

        const classificacao = times.map(time => {
            const jogosDoTime = jogos.filter(j =>
                j.time_casa_id === time.id || j.time_fora_id === time.id
            )

            let pontos = 0,
                vitorias = 0,
                empates = 0,
                derrotas = 0
            let gols_pro = 0,
                gols_contra = 0

            jogosDoTime.forEach(jogo => {
                const ehCasa = jogo.time_casa_id === time.id
                const meuGols = ehCasa ? jogo.gols_casa : jogo.gols_fora
                const golsAdv = ehCasa ? jogo.gols_fora : jogo.gols_casa

                gols_pro += meuGols
                gols_contra += golsAdv

                if (meuGols > golsAdv) {
                    pontos += 3;
                    vitorias++
                } else if (meuGols === golsAdv) {
                    pontos += 1;
                    empates++
                } else {
                    derrotas++
                }
            })

            return {
                time: time.nome,
                jogos: jogosDoTime.length,
                pontos,
                vitorias,
                empates,
                derrotas,
                gols_pro,
                gols_contra,
                saldo_gols: gols_pro - gols_contra
            }
        })

        classificacao.sort((a, b) =>
            b.pontos - a.pontos ||
            b.vitorias - a.vitorias ||
            b.saldo_gols - a.saldo_gols ||
            b.gols_pro - a.gols_pro
        )

        res.json(classificacao)
    } catch (error) {
        res.status(500).json({
            erro: 'Erro ao calcular classificação'
        })
    }
})

module.exports = router