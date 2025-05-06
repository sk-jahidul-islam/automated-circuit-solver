from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__, static_folder='.', static_url_path='')

# Helper functions for calculations

def ohms_law_calculate(voltage=None, current=None, resistance=None):
    try:
        if voltage is None:
            voltage = current * resistance
            return {'voltage': voltage}
        elif current is None:
            current = voltage / resistance
            return {'current': current}
        elif resistance is None:
            resistance = voltage / current
            return {'resistance': resistance}
        else:
            if abs(voltage - current * resistance)< 1e-6:
                return {'message': 'Values are consistent'}
            else:
                return {'error': 'Inconsistent values'}
    except Exception as e:
        return {'error': str(e)}

def resistors_series(resistors):
    try:
        total = sum(resistors)
        return {'total_resistance': total}
    except Exception as e:
        return {'error': str(e)}

def resistors_parallel(resistors):
    try:
        inv_sum = 0.0
        for r in resistors:
            if r == 0:
                return {'total_resistance': 0.0}
            inv_sum += 1.0 / r
        total = 1.0 / inv_sum if inv_sum != 0 else 0
        return {'total_resistance': total}
    except Exception as e:
        return {'error': str(e)}

def capacitance_series(capacitors):
    try:
        inv_sum = 0.0
        for c in capacitors:
            if c == 0:
                return {'total_capacitance': 0.0}
            inv_sum += 1.0 / c
        total = 1.0 / inv_sum if inv_sum != 0 else 0
        return {'total_capacitance': total}
    except Exception as e:
        return {'error': str(e)}

def capacitance_parallel(capacitors):
    try:
        total = sum(capacitors)
        return {'total_capacitance': total}
    except Exception as e:
        return {'error': str(e)}

def kirchhoff_voltage_law(voltage_sources, resistors):
    try:
        total_voltage = sum(voltage_sources)
        total_resistance = sum(resistors)
        if total_resistance == 0:
            return {'error': 'Total resistance cannot be zero'}
        current = total_voltage / total_resistance
        voltage_drops = [current * r for r in resistors]
        return {
            'total_voltage': total_voltage,
            'total_resistance': total_resistance,
            'current': current,
            'voltage_drops': voltage_drops
        }
    except Exception as e:
        return {'error': str(e)}

def unit_converter(value, from_unit, to_unit):
    unit_prefixes = {
        'p': 1e-12,
        'n': 1e-9,
        'u': 1e-6,
        'm': 1e-3,
        '': 1,
        'k': 1e3,
        'M': 1e6,
        'G': 1e9
    }
    def extract_prefix(unit):
        for prefix in unit_prefixes.keys():
            if unit.startswith(prefix):
                base = unit[len(prefix):]
                if base in ['ohm', 'v', 'a', 'f']:
                    return prefix, base
        return '', unit

    from_prefix, from_base = extract_prefix(from_unit.lower())
    to_prefix, to_base = extract_prefix(to_unit.lower())
    if from_base != to_base:
        return {'error': 'Incompatible units'}
    try:
        base_value = value * unit_prefixes[from_prefix]
        converted_value = base_value / unit_prefixes[to_prefix]
        return {'converted_value': converted_value}
    except Exception as e:
        return {'error': str(e)}

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/script.js')
def serve_script():
    return send_from_directory('.', 'script.js')

@app.route('/style.css')
def serve_style():
    return send_from_directory('.', 'style.css')

@app.route('/api/ohms-law', methods=['POST'])
def api_ohms_law():
    data = request.json
    voltage = data.get('voltage')
    current = data.get('current')
    resistance = data.get('resistance')
    voltage = float(voltage) if voltage not in [None, '', 'null'] else None
    current = float(current) if current not in [None, '', 'null'] else None
    resistance = float(resistance) if resistance not in [None, '', 'null'] else None
    result = ohms_law_calculate(voltage, current, resistance)
    return jsonify(result)

@app.route('/api/resistors-series', methods=['POST'])
def api_resistors_series():
    data = request.json
    resistors = data.get('resistors', [])
    try:
        resistors = [float(r) for r in resistors]
    except:
        return jsonify({'error': 'Invalid resistor values'})
    result = resistors_series(resistors)
    return jsonify(result)

@app.route('/api/resistors-parallel', methods=['POST'])
def api_resistors_parallel():
    data = request.json
    resistors = data.get('resistors', [])
    try:
        resistors = [float(r) for r in resistors]
    except:
        return jsonify({'error': 'Invalid resistor values'})
    result = resistors_parallel(resistors)
    return jsonify(result)

@app.route('/api/capacitance-series', methods=['POST'])
def api_capacitance_series():
    data = request.json
    capacitors = data.get('capacitors', [])
    try:
        capacitors = [float(c) for c in capacitors]
    except:
        return jsonify({'error': 'Invalid capacitor values'})
    result = capacitance_series(capacitors)
    return jsonify(result)

@app.route('/api/capacitance-parallel', methods=['POST'])
def api_capacitance_parallel():
    data = request.json
    capacitors = data.get('capacitors', [])
    try:
        capacitors = [float(c) for c in capacitors]
    except:
        return jsonify({'error': 'Invalid capacitor values'})
    result = capacitance_parallel(capacitors)
    return jsonify(result)

@app.route('/api/kvl', methods=['POST'])
def api_kvl():
    data = request.json
    voltages = data.get('voltages', [])
    resistors = data.get('resistances', [])
    try:
        voltages = [float(v) for v in voltages]
        resistors = [float(r) for r in resistors]
    except:
        return jsonify({'error': 'Invalid voltage or resistance values'})
    result = kirchhoff_voltage_law(voltages, resistors)
    return jsonify(result)

@app.route('/api/unit-convert', methods=['POST'])
def api_unit_convert():
    data = request.json
    value = data.get('value')
    from_unit = data.get('from_unit')
    to_unit = data.get('to_unit')
    try:
        value = float(value)
    except:
        return jsonify({'error': 'Invalid value for conversion'})
    if not from_unit or not to_unit:
        return jsonify({'error': 'Missing unit information'})
    result = unit_converter(value, from_unit, to_unit)
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)
