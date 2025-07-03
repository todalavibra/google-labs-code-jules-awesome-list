document.addEventListener('DOMContentLoaded', () => {
    const unitsPerMonthInput = document.getElementById('unitsPerMonth');
    const currentCostPerUnitInput = document.getElementById('currentCostPerUnit');
    const bioplasticCostPerUnitInput = document.getElementById('bioplasticCostPerUnit');
    const calculateBtn = document.getElementById('calculateBtn');
    const resultsDiv = document.getElementById('results');
    const errorMessagesDiv = document.getElementById('errorMessages');

    const currentMonthlyCostSpan = document.getElementById('currentMonthlyCost');
    const bioplasticMonthlyCostSpan = document.getElementById('bioplasticMonthlyCost');
    const monthlyDifferenceSpan = document.getElementById('monthlyDifference');
    const annualImpactSpan = document.getElementById('annualImpact');
    const savingsOrCostMessageSpan = document.getElementById('savingsOrCostMessage');
    const impactSummaryP = document.querySelector('.impact-summary');


    calculateBtn.addEventListener('click', () => {
        // Clear previous errors and results
        errorMessagesDiv.innerHTML = '';
        errorMessagesDiv.style.display = 'none';
        resultsDiv.style.display = 'none';

        // Get input values
        const unitsPerMonth = parseFloat(unitsPerMonthInput.value);
        const currentCostPerUnit = parseFloat(currentCostPerUnitInput.value);
        const bioplasticCostPerUnit = parseFloat(bioplasticCostPerUnitInput.value);

        // Validate inputs
        let errors = [];
        if (isNaN(unitsPerMonth) || unitsPerMonth <= 0) {
            errors.push("El número de unidades por mes debe ser un número positivo.");
        }
        if (isNaN(currentCostPerUnit) || currentCostPerUnit < 0) {
            errors.push("El costo actual por unidad plástica debe ser un número no negativo.");
        }
        if (isNaN(bioplasticCostPerUnit) || bioplasticCostPerUnit < 0) {
            errors.push("El costo por unidad de bioplástico debe ser un número no negativo.");
        }

        if (errors.length > 0) {
            errorMessagesDiv.innerHTML = errors.map(e => `<p>${e}</p>`).join('');
            errorMessagesDiv.style.display = 'block';
            return;
        }

        // Perform calculations
        const currentMonthlyCost = unitsPerMonth * currentCostPerUnit;
        const bioplasticMonthlyCost = unitsPerMonth * bioplasticCostPerUnit;
        const monthlyDifference = bioplasticMonthlyCost - currentMonthlyCost;
        const annualImpact = monthlyDifference * 12;

        // Display results
        currentMonthlyCostSpan.textContent = currentMonthlyCost.toFixed(2);
        bioplasticMonthlyCostSpan.textContent = bioplasticMonthlyCost.toFixed(2);
        monthlyDifferenceSpan.textContent = monthlyDifference.toFixed(2);
        annualImpactSpan.textContent = annualImpact.toFixed(2);

        // Update summary message and styling
        if (monthlyDifference < 0) {
            savingsOrCostMessageSpan.textContent = `Esto representa un AHORRO mensual estimado de ${Math.abs(monthlyDifference).toFixed(2)} ARS.`;
            monthlyDifferenceSpan.style.color = 'green';
            annualImpactSpan.style.color = 'green';
            impactSummaryP.classList.remove('increased-cost');
        } else if (monthlyDifference > 0) {
            savingsOrCostMessageSpan.textContent = `Esto representa un COSTO ADICIONAL mensual estimado de ${monthlyDifference.toFixed(2)} ARS.`;
            monthlyDifferenceSpan.style.color = 'red';
            annualImpactSpan.style.color = 'red';
            impactSummaryP.classList.add('increased-cost');
        } else {
            savingsOrCostMessageSpan.textContent = "No hay diferencia en el costo mensual.";
            monthlyDifferenceSpan.style.color = 'black';
            annualImpactSpan.style.color = 'black';
            impactSummaryP.classList.remove('increased-cost');
        }

        resultsDiv.style.display = 'block';
    });
});
