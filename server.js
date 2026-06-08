const express = require('express')
const path = require('path')
const helmet = require('helmet')
const cors = require('cors')
const rateLimit = require('express-rate-limit')

const campeonatosRoutes = require('./routes/campeonatos')
const timesRoutes = require('./routes/times')
const jogosRoutes = require('./routes/jogos')


const app = express()
const PORT = process.env.PORT || 3000

app.use(helmet())

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
}))

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {erro: 'Muitas requisições, tente novamente em 15 minutos'}
})

app.use(limiter)
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

app.use('/api/campeonatos', campeonatosRoutes)
app.use('/api/times', timesRoutes)
app.use('/api/jogos', jogosRoutes)


app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        mensagem: 'Servidor rodando!'
    })
})

app.use((req, res) => {
    res.status(404).json({
        erro: 'Rota não encontrada'
    })
})

app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).json({
        erro: 'Erro interno do servidor'
    })
})

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`)
})