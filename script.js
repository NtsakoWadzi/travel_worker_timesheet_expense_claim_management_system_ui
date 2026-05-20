const allocationItems = [
  ['0436', 'T&S Allowance Not Exceeding Amount Set By SARS', '3705'],
  ['0717', 'T&S Allowance Exceeding Amount Set By SARS', '3704'],
  ['0462', 'T&S Dom: Accommodation', 'N/A'],
  ['0463', 'T&S Dom: Other Transport Provided (Gautrain)', 'N/A'],
  ['0497', 'T&S Dom: Road Transport', 'N/A'],
  ['0498', 'T&S Dom: Parking', 'N/A'],
  ['0499', 'T&S Toll Fees', 'N/A'],
  ['0469', 'T&S Dom: Km All Own Transport', '3702'],
  ['0470', 'T&S Dom: Km All Own Transport', '3703'],
  ['0515', 'T&S Dom: Fuel Expenditure', 'N/A'],
  ['0494', 'T&S Dom: Actual Exp Accommodation & Meals', 'N/A'],
  ['0588', 'T&S Dom: Food & Beverage', 'N/A'],
  ['0674', 'T&S Dom: Air Travel', 'N/A'],
  ['0514', 'T&S Travel Documents Visas & Passports', 'N/A'],
  ['0476', 'T&S Foreign: Accommodation', 'N/A'],
  ['0477', 'T&S Foreign: Road Transport', 'N/A'],
  ['0473', 'T&S Overseas Not Exceeding Amount Set By SARS', '3716'],
  ['0444', 'T&S Overseas Exceeding Amount Set By SARS', '3715'],
  ['0500', 'T&S Airtime and Data Mobile', 'N/A'],
  ['0501', 'T&S Foreign: Accommodation & Meals', 'N/A'],
  ['0589', 'T&S Foreign: Food & Beverage', 'N/A'],
  ['0464', 'T&S Foreign: Parking Expenditure', 'N/A'],
  ['0465', 'T&S Foreign: Toll Fees', 'N/A'],
  ['0504', 'T&S Foreign: Railway Transport', 'N/A'],
  ['0650', 'T&S Foreign: Incidental Cost', 'N/A'],
];

const rowsContainer = document.getElementById('allocationRows');
const subTotalInput = document.getElementById('subTotal');
const advanceInput = document.getElementById('advanceAmount');
const totalInput = document.getElementById('totalAmount');

allocationItems.forEach(([persalCode, description, sarsCode], index) => {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td><input type="checkbox" class="allocation-check" aria-label="Select ${description}"></td>
    <td>${persalCode}</td>
    <td>${description}</td>
    <td>${sarsCode}</td>
    <td><input type="number" class="allocation-amount" name="amount-${index}" min="0" step="0.01" value="0.00"></td>
  `;
  rowsContainer.appendChild(row);
});

function toMoney(value) {
  return Number(value || 0).toFixed(2);
}

function calculateTotals() {
  const amounts = [...document.querySelectorAll('.allocation-amount')];
  const subtotal = amounts.reduce((sum, input) => sum + Number(input.value || 0), 0);
  const advance = Number(advanceInput.value || 0);

  subTotalInput.value = toMoney(subtotal);
  totalInput.value = toMoney(subtotal - advance);
}

document.addEventListener('input', (event) => {
  if (event.target.matches('.allocation-amount, #advanceAmount')) {
    calculateTotals();
  }
});

document.getElementById('printButton').addEventListener('click', () => {
  window.print();
});

document.getElementById('claimForm').addEventListener('submit', (event) => {
  event.preventDefault();
  calculateTotals();
  alert('Claim form captured successfully.');
});

calculateTotals();
