import os
import random
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Mock sensor data generator
def get_sensor_data():
    return {
        "moisture": round(random.uniform(40.0, 50.0), 1),
        "temperature": round(random.uniform(27.0, 31.0), 1),
        "ec": random.randint(300, 400),
        "ph": round(random.uniform(6.2, 7.0), 1),
        "n": random.randint(40, 60),
        "p": random.randint(25, 40),
        "k": random.randint(80, 110),
        "valid": True
    }

@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "service": "Agrisense Backend API",
        "status": "online",
        "endpoints": {
            "/data": "Get current telemetry sensor reading",
            "/health": "Health check status"
        }
    })

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy"}), 200

@app.route("/data", methods=["GET"])
def data():
    sensor_data = get_sensor_data()
    return jsonify(sensor_data)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
