const endpoint = "https://api.stakingrewards.com/public/query";
const query = `
    {
        rewardOptions(
            where: {
                inputAsset: { slugs: ["polkadot"] }
                typeKeys: ["pos"]
            }
            order: { metricKey_desc: "staked_tokens" }
            limit: 150
            offset: 0
        ) {
            providers(limit: 1) {
                name
            }
            metrics(where: { metricKeys: ["reward_rate"] }, limit: 1) {
                metricKey
                defaultValue
            }    
        }
    }
`;

const apiKeys = [
    "e6a9e235-87ad-4c41-971a-f820b66b4b52",
    "63990293-4e4b-4d38-8b81-d940a797c47e",
    "538b825d-2925-403d-8f96-f44c83c6f4ad",
    "99dc4f69-404a-496a-82bc-e84df600530c",
    "a289d9f1-8fa0-4b50-bc65-2f2c27fa713e",
    "735eab0f-56b5-459e-880e-b12bd4ea5e41",
    "95ca4c82-3fd6-4427-b3e2-ccc9d07dc88e",
    "54332ed4-b928-46dd-ae5f-25c346bc8880",
    "fd50e040-d3f2-43f8-a5bf-e23a5c4659c2",
    "d2c8aa05-f477-4a3c-b45b-2fe981635949",
    "25211f76-b308-43e4-86f3-f0ed0b2a7d2b",
    "54f7e284-6261-49f2-aa6b-367c7004c194",
    "9fdbf704-eea1-45c1-9c5d-ef50bc69ae44",
    "385cd12a-50ce-48b2-93fb-ae44db278bca",
    "355887a2-2f2b-4145-86e8-f081ae0c4b95",
    "2a87184d-18f4-477d-9045-1b121efd6de9",
    "6306993d-3859-4398-8857-c8605be18f81",
    "bdcbe7c5-e42e-4a72-820f-488ef6fb3ef9",
    "a8f1a7e2-f7cf-4a33-ae11-57d091376466",
    "6e20307f-3120-4943-90c4-57fa3ef296da",
    "02abac4b-0469-4172-a55a-4af4c33d1042",
    "12d019e2-0d33-48a3-9835-08f8e1982546",
    "e1f9c04a-973a-491d-b95d-8a4851dcf075",
    "519a8906-7c0d-4a39-9143-246c7cba376c",
    "77221a4c-fe79-4a45-a9bb-3269be99e2fa",
    "87b98419-9a26-46c3-8acf-57b0eabd3714",
    "a8399452-cd23-4a1c-891a-62a9c061ddad",
    "4f9c5c20-4221-4e24-bd26-63db8655ff4c",
    "56f56ba8-8a84-4dbd-be62-3b2401af8dbe",
    "7eaee293-75a0-4abe-86a4-44ce1ef48282"
];

let apiKeyIndex = 0;

let rewardMetrics = [];
let stakingChart;

function initializeChart() {
    const apiKey = apiKeys[apiKeyIndex];

    fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-API-KEY": apiKey,
        },
        body: JSON.stringify({ query }),
    })
        .then((response) => response.json())
        .then((data) => {
            const rewardOptionsData = data?.data?.rewardOptions;

            if (Array.isArray(rewardOptionsData) && rewardOptionsData.length > 0) {
                rewardMetrics = rewardOptionsData.map((option) => {
                    const metricsData = option.metrics;
                    const rate = metricsData ? metricsData[0]?.defaultValue.toFixed(2) : null;
                    const providerName = option.providers ? option.providers[0]?.name.toUpperCase() : null;

                    return {
                        rate,
                        providerName,
                    };
                }).filter(value => value.providerName !== null);

                const stakingOptionSelect = document.getElementById('stakingOption');
                rewardMetrics.forEach((option, index) => {
                    const rate = option.rate;
                    const providerName = option.providerName;

                    if (providerName !== null) {
                        const optionElement = document.createElement('option');
                        optionElement.value = index;
                        optionElement.text = `${providerName} - ${rate}%`;
                        stakingOptionSelect.add(optionElement);
                    }
                });
            } else {
                // console.error("Reward options not found in the response");
                apiKeyIndex = (apiKeyIndex + 1) % apiKeys.length;
                initializeChart();
            }
        });

    const dummyData = Array.from({ length: 365 }, (_, i) => 0);
    createChart(dummyData);
}

document.addEventListener('DOMContentLoaded', initializeChart);

function calculateAPR() {
    const selectedOptionIndex = document.getElementById('stakingOption').value;
    const stakingAmount = parseFloat(document.getElementById('stakingAmount').value);
    const timePeriod = document.getElementById('timePeriod').value;

    if (!isNaN(stakingAmount) && stakingAmount > 0) {
        const selectedRate = rewardMetrics[selectedOptionIndex];

        const gains = [];
        const compoundedGains = [];
        let totalGains = 0;
        let compoundedTotalGains = 0;
        const daysInYear = 365;

        for (let day = 1; day <= daysInYear; day++) {
            const dailyGains = (stakingAmount * selectedRate.rate * (1 / daysInYear)) / 100;

            totalGains += dailyGains;
            gains.push(totalGains.toFixed(2));

            const compoundedDailyGains = (stakingAmount + compoundedTotalGains) * (selectedRate.rate / 100) / daysInYear;
            compoundedTotalGains += compoundedDailyGains;
            compoundedGains.push(compoundedTotalGains.toFixed(2));
        }

        stakingChart.data.datasets[0].data = gains;
        stakingChart.data.datasets[1].data = compoundedGains;
        stakingChart.update();

        const resultElement = document.getElementById('result');
        switch (timePeriod) {
            case 'day':
                resultElement.innerHTML = `${(totalGains / 365).toFixed(2)}$`;
                break;
            case 'week':
                resultElement.innerHTML = `${(totalGains / 52).toFixed(2)}$`;
                break;
            case 'month':
                resultElement.innerHTML = `${(totalGains / 12).toFixed(2)}$`;
                break;
            case 'year':
                resultElement.innerHTML = `${totalGains.toFixed(2)}$`;
                break;
        }
    } else {
        document.getElementById('result').innerHTML = '0$';
    }
}



function createChart(data, compoundedData) {
    const ctx = document.getElementById('stakingChart').getContext('2d');

    stakingChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({ length: 365 }, (_, i) => (i + 1).toString()),
            datasets: [
                {
                    label: 'Staking Reward',
                    data: data,
                    borderColor: 'rgb(255,20,147)',
                    pointRadius: 1,
                    pointBackgroundColor: 'rgb(255, 20, 147)',
                    fill: false,
                },
                {
                    label: 'Compounded Staking Reward',
                    data: compoundedData,
                    borderColor: 'rgb(160,32,240)',
                    pointRadius: 1,
                    pointBackgroundColor: 'rgb(160,32,240)',
                    fill: false,

                },
            ],

        },
        options: {

            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                    },
                    ticks: {
                        min: 0,
                        max: 365,
                        stepSize: 365,
                        display: true,
                        callback: function (value) {
                            return value === 0 ? 'Today' : value + ' days';
                        },
                    },
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                    },
                    ticks: {
                        callback: function (value) {
                            return value === 0 ? ' ' : value + '$';
                        },
                    }
                },
            },

            plugins: {

                tooltip: {

                    mode: 'index',
                    intersect: false,
                    callbacks: {

                        label: function (context) {
                            var label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += parseFloat(context.parsed.y).toFixed(2) + '$';

                            label += ' (' + context.label + ' days)';

                            return label;
                        },
                        title: function () {
                            return null;
                        },
                    },

                },
                interaction: {
                    intersect: false,
                    axis: 'x',
                },
                legend: {
                    display: true,
                    labels: {
                        font: {
                            size: 10,
                            family: 'Arial',
                        },
                        padding: 10,
                        usePointStyle: true,
                    },
                },

                customLinePlugin: {
                    lineYValue: 0,
                },
            },
        },
        plugins: [{
            afterDraw: chart => {
                if (chart.tooltip?._active?.length) {
                    let x = chart.tooltip._active[0].element.x;
                    let yAxis = chart.scales.y;
                    let ctx = chart.ctx;
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(x, yAxis.top);
                    ctx.lineTo(x, yAxis.bottom);
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = 'grey';
                    ctx.stroke();
                    ctx.restore();
                }
            },
            beforeEvent: function (chart, event) {
                const yAxes = chart.scales.y;
                const mouseY = event.y;

                chart.options.plugins.customLinePlugin.lineYValue = yAxes.getValueForPixel(mouseY);
            }

        }],
    });
}



// document.getElementById('updateChartButton').addEventListener('click', calculateAPR);
