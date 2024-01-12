
const endpoint = "https://api.stakingrewards.com/public/query";
const query = `
{
    rewardOptions(
        where: {
          inputAsset: { slugs: ["polkadot"] }
          typeKeys: ["pos"]
        }
        order: { metricKey_desc: "staked_tokens" }
        limit: 20
        offset: 0
      ) {
        providers(limit: 1) {
        name
        }
        metrics(where: { metricKeys: ["reward_rate"] }, limit: 7) {
          metricKey
          defaultValue
        }    
      }
    }
`;

const apiKey = "57991f98-4abc-4881-befe-1863508f503c";

let rewardMetrics = [];

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
            }).filter(value => value.providerName !== null); // Filter out options with null providerSlug

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
            console.error("Reward options not found in the response");
        }

    });

function calculateAPR() {
    const selectedOptionIndex = document.getElementById('stakingOption').value;
    const stakingAmount = parseFloat(document.getElementById('stakingAmount').value);
    const timePeriod = document.getElementById('timePeriod').value;

    if (!isNaN(stakingAmount)) {
        if (stakingAmount) {

            const selectedRate = rewardMetrics[selectedOptionIndex];

            let apr;
            switch (timePeriod) {
                case 'day':
                    apr = (stakingAmount * selectedRate.rate * (1 / 365)) / 100;
                    break;
                case 'week':
                    apr = (stakingAmount * selectedRate.rate * (1 / 52)) / 100;
                    break;
                case 'month':
                    apr = (stakingAmount * selectedRate.rate * (1 / 12)) / 100;
                    break;
                case 'year':
                    apr = (stakingAmount * selectedRate.rate) / 100;
                    break;
                default:
                    break;
            }

            document.getElementById('result').innerHTML = `Estimated APR for ${timePeriod}: ${apr.toFixed(2)} $`;
        }
    } else {
        document.getElementById('result').innerHTML = 'Please enter a valid staking amount.';
    }
}



