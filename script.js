let graficoDolar, graficoEuro, graficoYuan, graficoBitcoin;
let periodoAtual = 'dia';

function atualizarCotacoes() {
    fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,CNY-BRL,BTC-BRL')
        .then(response => response.json())
        .then(data => {
            const cotacaoDolar = parseFloat(data.USDBRL.bid).toFixed(2);
            const cotacaoEuro = parseFloat(data.EURBRL.bid).toFixed(2);
            const cotacaoYuan = parseFloat(data.CNYBRL.bid).toFixed(2);
            const cotacaoBitcoin = parseFloat(data.BTCBRL.bid).toFixed(2);
            document.getElementById('cotacao-dolar').textContent = cotacaoDolar;
            document.getElementById('cotacao-euro').textContent = cotacaoEuro;
            document.getElementById('cotacao-yuan').textContent = cotacaoYuan;
            document.getElementById('cotacao-bitcoin').textContent = cotacaoBitcoin;
        })
        .catch(error => {
            console.error('Erro ao obter cotações:', error);
            document.getElementById('cotacao-dolar').textContent = 'Indisponível';
            document.getElementById('cotacao-euro').textContent = 'Indisponível';
            document.getElementById('cotacao-yuan').textContent = 'Indisponível';
            document.getElementById('cotacao-bitcoin').textContent = 'Indisponível';
        });
}

function obterDadosHistoricos(moeda) {
    let dias;
    switch(periodoAtual) {
        case 'dia': 
            return fetch(`https://economia.awesomeapi.com.br/json/${moeda}-BRL/100`)
                .then(response => response.json())
                .then(data => {
                    return data.map(item => ({
                        data: new Date(item.timestamp * 1000),
                        valor: parseFloat(item.bid)
                    })).reverse();
                });
        case 'mes': 
            dias = 30; 
            break;
        case 'ano': 
            dias = 365; 
            break;
        default: 
            dias = 1;
    }

    return fetch(`https://economia.awesomeapi.com.br/json/daily/${moeda}-BRL/${dias}`)
        .then(response => response.json())
        .then(data => {
            return data.map(item => ({
                data: new Date(item.timestamp * 1000),
                valor: parseFloat(item.bid)
            })).reverse();
        });
}

function criarGrafico(dados, moeda) {
    const ctx = document.getElementById(`grafico-${moeda.toLowerCase()}`).getContext('2d');
    const cores = {
        'USD': '#007bff',
        'EUR': '#28a745',
        'CNY': '#ff5733',
        'BTC': '#f2a900'
    };
    const nomes = {
        'USD': 'Dólar',
        'EUR': 'Euro',
        'CNY': 'Yuan',
        'BTC': 'Bitcoin'
    };

    const graficoConfig = {
        type: 'line',
        data: {
            labels: dados.map(item => periodoAtual === 'dia' ? 
                item.data.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) : 
                item.data.toLocaleDateString('pt-BR')),
            datasets: [{
                label: nomes[moeda],
                data: dados.map(item => item.valor),
                borderColor: cores[moeda],
                backgroundColor: cores[moeda],
                tension: 0.1,
                borderWidth: 2,
                pointRadius: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: R$ ${context.parsed.y.toFixed(4)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: periodoAtual === 'dia' ? 'Hora' : 'Data'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Valor em R$'
                    },
                    ticks: {
                        callback: function(value) {
                            return `R$ ${value.toFixed(2)}`;
                        }
                    }
                }
            }
        }
    };

    if (moeda === 'USD') {
        if (graficoDolar) graficoDolar.destroy();
        graficoDolar = new Chart(ctx, graficoConfig);
    } else if (moeda === 'EUR') {
        if (graficoEuro) graficoEuro.destroy();
        graficoEuro = new Chart(ctx, graficoConfig);
    } else if (moeda === 'CNY') {
        if (graficoYuan) graficoYuan.destroy();
        graficoYuan = new Chart(ctx, graficoConfig);
    } else {
        if (graficoBitcoin) graficoBitcoin.destroy();
        graficoBitcoin = new Chart(ctx, graficoConfig);
    }
}

function mudarPeriodo(periodo) {
    periodoAtual = periodo;
    atualizarGraficos();
}

function atualizarGraficos() {
    Promise.all([
        obterDadosHistoricos('USD'),
        obterDadosHistoricos('EUR'),
        obterDadosHistoricos('CNY'),
        obterDadosHistoricos('BTC')
    ]).then(([dadosDolar, dadosEuro, dadosYuan, dadosBitcoin]) => {
        criarGrafico(dadosDolar, 'USD');
        criarGrafico(dadosEuro, 'EUR');
        criarGrafico(dadosYuan, 'CNY');
        criarGrafico(dadosBitcoin, 'BTC');
    }).catch(error => {
        console.error('Erro ao atualizar gráficos:', error);
    });
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    atualizarCotacoes();
    atualizarGraficos();
    setInterval(atualizarCotacoes, 5000);
    setInterval(atualizarGraficos, periodoAtual === 'dia' ? 60000 : 3600000);
});

