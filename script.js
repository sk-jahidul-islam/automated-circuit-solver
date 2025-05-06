// Tab navigation
const tabs = document.querySelectorAll('nav button.tablink');
const sections = document.querySelectorAll('main section.tabcontent');
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected','false');
    });
    sections.forEach(s => s.style.display = 'none');
    tab.classList.add('active');
    tab.setAttribute('aria-selected','true');
    const activeId = tab.getAttribute('data-tab');
    document.getElementById(activeId).style.display = 'block';
  });
});

// Utility: create input field with delete button
function createInputField(placeholder = '', min=0) {
  const div = document.createElement('div');
  const input = document.createElement('input');
  input.type = 'number';
  input.step = 'any';
  input.min = min;
  input.placeholder = placeholder;
  input.required = true;
  const delBtn = document.createElement('button');
  delBtn.type = 'button';
  delBtn.textContent = 'Delete';
  delBtn.className = 'small-btn';
  delBtn.title = 'Delete this entry';
  delBtn.addEventListener('click', () => {
    div.remove();
  });
  div.appendChild(input);
  div.appendChild(delBtn);
  return div;
}

// Mapping for units display for each result key
const unitsMap = {
  voltage: 'V',
  current: 'A',
  resistance: 'Ω',
  total_resistance: 'Ω',
  total_voltage: 'V',
  total_capacitance: 'F',
  capacitance: 'F',
  converted_value: '',
  message: '',
  voltage_drops: 'V'
};

// Format and show results with units, two decimals, and spaces in labels
function formatResult(data) {
  let lines = [];
  for(let key in data) {
    if(data.hasOwnProperty(key)) {
      let val = data[key];
      if(key === 'voltage_drops' && Array.isArray(val)) {
        lines.push('Voltage Drops: ' + val.map(v => Number(v).toFixed(2) + ' ' + unitsMap['voltage_drops']).join(', '));
        continue;
      }
      if(key === 'message' && !val) continue;
      let unit = unitsMap[key] || '';
      let label = key.replace(/_/g, ' ').replace(/^./, str => str.toUpperCase());
      if(key === 'message') {
        lines.push(val);
      } else {
        lines.push(label + ': ' + Number(val).toFixed(2) + (unit ? ' ' + unit : ''));
      }
    }
  }
  return lines.join('\n');
}

// Ohm's Law calculation and display
document.getElementById('btn-ohms-calc').addEventListener('click', () => {
  let V = document.getElementById('ohm-voltage').value;
  let I = document.getElementById('ohm-current').value;
  let R = document.getElementById('ohm-resistance').value;

  fetch('/api/ohms-law', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      voltage: V.trim() === '' ? null : V,
      current: I.trim() === '' ? null : I,
      resistance: R.trim() === '' ? null : R
    })
  }).then(res => res.json()).then(data => {
    let resultDiv = document.getElementById('ohms-result');
    if(data.error) {
      resultDiv.textContent = 'Error: ' + data.error;
    } else {
      resultDiv.textContent = formatResult(data);
    }
  });
});

// Resistors Network
const resistorsList = document.getElementById('resistors-list');
const addResistorBtn = document.getElementById('add-resistor');

function addResistor(value='') {
  let div = createInputField('Resistor Ω',0);
  if(value) div.querySelector('input').value = value;
  resistorsList.appendChild(div);
}

addResistorBtn.addEventListener('click', () => addResistor());

document.getElementById('calc-resistors').addEventListener('click', () => {
  const connectionType = document.getElementById('resistor-connection').value;
  let resistors = [...resistorsList.querySelectorAll('input')].map(i => parseFloat(i.value));
  if(resistors.some(isNaN)) {
    alert('Please enter valid resistor values');
    return;
  }
  let url = (connectionType === 'series') ? '/api/resistors-series' : '/api/resistors-parallel';

  fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({resistors})
  }).then(res => res.json()).then(data => {
    let resDiv = document.getElementById('resistors-result');
    if(data.error) resDiv.textContent = 'Error: ' + data.error;
    else {
      resDiv.textContent = formatResult(data);
    }
  });
});

if(resistorsList.childElementCount === 0){
  addResistor();
  addResistor();
}

// Kirchhoff Voltage Law
const voltagesList = document.getElementById('voltages-list');
const resistancesList = document.getElementById('resistances-list');

document.getElementById('add-voltage').addEventListener('click', () => {
  voltagesList.appendChild(createInputField('Voltage (V)',0));
});
document.getElementById('add-resistance').addEventListener('click', () => {
  resistancesList.appendChild(createInputField('Resistance (Ω)',0));
});

if(voltagesList.childElementCount === 0){
  voltagesList.appendChild(createInputField('Voltage (V)',0));
}
if(resistancesList.childElementCount === 0){
  resistancesList.appendChild(createInputField('Resistance (Ω)',0));
}

document.getElementById('calc-kvl').addEventListener('click', () => {
  let voltages = [...voltagesList.querySelectorAll('input')].map(i => parseFloat(i.value));
  let resistors = [...resistancesList.querySelectorAll('input')].map(i => parseFloat(i.value));
  if(voltages.some(isNaN) || resistors.some(isNaN)) {
    alert('Please enter valid voltages and resistances');
    return;
  }
  fetch('/api/kvl', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      voltages: voltages,
      resistances: resistors
    })
  }).then(res => res.json()).then(data => {
    let kvlRes = document.getElementById('kvl-result');
    if(data.error) {
      kvlRes.textContent = 'Error: ' + data.error;
    } else {
      kvlRes.textContent = formatResult(data);
    }
  });
});

// Capacitance Calculator
const capacitorsList = document.getElementById('capacitors-list');
document.getElementById('add-capacitor').addEventListener('click', () => {
  capacitorsList.appendChild(createInputField('Capacitance (F)',0));
});

if(capacitorsList.childElementCount === 0){
  capacitorsList.appendChild(createInputField('Capacitance (F)',0));
  capacitorsList.appendChild(createInputField('Capacitance (F)',0));
}

document.getElementById('calc-capacitance').addEventListener('click', () => {
  let capacitors = [...capacitorsList.querySelectorAll('input')].map(i => parseFloat(i.value));
  if(capacitors.some(isNaN)) {
    alert('Please enter valid capacitance values');
    return;
  }
  let connType = document.getElementById('capacitance-connection').value;
  let url = (connType === 'series') ? '/api/capacitance-series' : '/api/capacitance-parallel';

  fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({capacitors})
  }).then(res => res.json()).then(data => {
    let capRes = document.getElementById('capacitance-result');
    if(data.error) capRes.textContent = 'Error: ' + data.error;
    else capRes.textContent = formatResult(data);
  });
});

// Unit Converter
document.getElementById('btn-convert').addEventListener('click', () => {
  const val = document.getElementById('convert-value').value;
  let fromUnit = document.getElementById('convert-from').value;
  let toUnit = document.getElementById('convert-to').value;
  if(val.trim() === '' || isNaN(val)) {
    alert('Enter a valid numeric value');
    return;
  }
  fetch('/api/unit-convert', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      value: val,
      from_unit: fromUnit.toLowerCase(),
      to_unit: toUnit.toLowerCase()
    })
  }).then(res => res.json()).then(data => {
    let convRes = document.getElementById('convert-result');
    if(data.error) convRes.textContent = 'Error: ' + data.error;
    else convRes.textContent = formatResult(data);
  });
});