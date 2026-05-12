const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, 'campeonato.db')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS campeonatos (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    nome       TEXT    NOT NULL,
    modalidade TEXT    NOT NULL CHECK(modalidade IN ('fut7', 'futsal')),
    status     TEXT    NOT NULL DEFAULT 'ativo' CHECK(status IN ('ativo', 'encerrado')),
    criado_em  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS times (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    nome           TEXT    NOT NULL,
    campeonato_id  INTEGER NOT NULL,
    responsavel    TEXT    NOT NULL,
    criado_em      TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (campeonato_id) REFERENCES campeonatos(id)
  );

  CREATE TABLE IF NOT EXISTS jogos (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    campeonato_id   INTEGER NOT NULL,
    time_casa_id    INTEGER NOT NULL,
    time_fora_id    INTEGER NOT NULL,
    gols_casa       INTEGER DEFAULT NULL,
    gols_fora       INTEGER DEFAULT NULL,
    status          TEXT    NOT NULL DEFAULT 'agendado' CHECK(status IN ('agendado', 'encerrado')),
    data_jogo       TEXT    NOT NULL,
    criado_em       TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (campeonato_id)  REFERENCES campeonatos(id),
    FOREIGN KEY (time_casa_id)   REFERENCES times(id),
    FOREIGN KEY (time_fora_id)   REFERENCES times(id)
  );
`)

module.exports = db