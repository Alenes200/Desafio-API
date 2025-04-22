const dbService = require('../services/db.service');

async function testDatabase() {
    try {
        console.log('Iniciando teste do banco de dados...');
        
        // Testa conexão
        await dbService.open();
        console.log('✓ Conexão com banco estabelecida');

        // Testa operação de escrita
        const testKey = 'test:' + Date.now();
        await dbService.put(testKey, { test: true });
        console.log('✓ Operação de escrita bem sucedida');

        // Testa operação de leitura
        const testData = await dbService.get(testKey);
        console.log('✓ Operação de leitura bem sucedida:', testData);

        // Testa operação de exclusão
        await dbService.delete(testKey);
        console.log('✓ Operação de exclusão bem sucedida');

        await dbService.close();
        console.log('✓ Conexão fechada com sucesso');
        console.log('Todos os testes passaram!');
    } catch (error) {
        console.error('Erro durante os testes:', error);
    }
}

testDatabase();