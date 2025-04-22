const rocksdb = require('@salto-io/rocksdb');
const path = require('path');

const dbPath = path.join(__dirname, '../data/database');
const db = rocksdb(dbPath);

const dbService = {
    async open() {
        return new Promise((resolve, reject) => {
            db.open({ createIfMissing: true }, (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    },

    async close() {
        return new Promise((resolve, reject) => {
            db.close((err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    },

    async get(key) {
        return new Promise((resolve, reject) => {
            console.log(`Tentando buscar chave: ${key}`);
            db.get(key, (err, value) => {
                if (err) {
                    if (err.message.includes('NotFound')) {
                        console.error(`Chave ${key} não encontrada no banco de dados.`);
                        resolve(null);
                    } else {
                        console.error(`Erro ao buscar chave ${key}:`, err);
                        reject(err);
                    }
                    return;
                }
                try {
                    resolve(JSON.parse(value));
                } catch (e) {
                    resolve(value);
                }
            });
        });
    },

    async put(key, value) {
        return new Promise((resolve, reject) => {
            db.put(key, JSON.stringify(value), (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    },

    async del(key) {
        return new Promise((resolve, reject) => {
            console.log(`Tentando deletar chave: ${key}`);
            db.del(key, (err) => {
                if (err) {
                    console.error(`Erro ao deletar chave ${key}:`, err);
                    return reject(err);
                }
                console.log(`Chave ${key} deletada com sucesso.`);
                resolve();
            });
        });
    },

    async getAll(prefix) {
        return new Promise((resolve, reject) => {
            const items = [];
            
            const iterator = db.iterator({
                keyAsBuffer: false,
                valueAsBuffer: false
            });

            function getNext() {
                iterator.next((err, key, value) => {
                    if (err) {
                        iterator.end(() => reject(err));
                        return;
                    }

                    // Se não há mais itens, finaliza
                    if (!key) {
                        iterator.end(() => resolve(items));
                        return;
                    }

                    // Se tem prefixo definido e a key não começa com ele, continua
                    if (!prefix || key.startsWith(prefix)) {
                        try {
                            items.push({
                                key,
                                value: JSON.parse(value)
                            });
                        } catch (e) {
                            items.push({
                                key,
                                value
                            });
                        }
                    }

                    // Busca próximo item
                    getNext();
                });
            }

            getNext();
        });
    },

    // Função para listar todas as chaves
    async getAllKeys(prefix) {
        return new Promise((resolve, reject) => {
            const keys = [];
            
            const iterator = db.iterator();
            
            const getNext = (iterator) => {
                iterator.next((err, key) => {
                    if (err) {
                        iterator.end(() => reject(err));
                        return;
                    }
                    
                    if (!key) {
                        iterator.end(() => resolve(keys));
                        return;
                    }

                    const keyStr = key.toString();
                    if (!prefix || keyStr.startsWith(prefix)) {
                        keys.push(keyStr);
                    }

                    getNext(iterator);
                });
            };

            getNext(iterator);
        });
    }
};

module.exports = dbService;
