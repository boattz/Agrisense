# 🌱 Agrisense — Smart Solar Sprinkler

> ระบบรดน้ำอัจฉริยะพลังงานแสงอาทิตย์ พร้อมแสดงผลข้อมูลเซ็นเซอร์ดินแบบ Real-time

![Platform](https://img.shields.io/badge/Platform-ESP32-blue)
![Language](https://img.shields.io/badge/Language-C%2B%2B%20%7C%20Python%20%7C%20HTML-green)
![Backend](https://img.shields.io/badge/Backend-Flask-lightgrey)
![Deploy](https://img.shields.io/badge/Deploy-Render-purple)
![Protocol](https://img.shields.io/badge/Protocol-RS485%20Modbus-orange)

---

## 📖 ภาพรวมโปรเจกต์

**Agrisense** คือระบบ IoT สำหรับการเกษตรอัจฉริยะ ที่ใช้ **ESP32** อ่านค่าเซ็นเซอร์ดิน 7-in-1 ผ่านโปรโตคอล **RS485 Modbus** และแสดงผลผ่านแดชบอร์ดเว็บแบบ Real-time ระบบรองรับทั้งการแสดงผลโดยตรงจาก ESP32 (Local Network) และผ่าน Cloud Backend (Render.com)

### ✨ คุณสมบัติหลัก

- 📊 **Real-time Dashboard** — แสดงค่าเซ็นเซอร์ดินแบบ Live ทุก 5 วินาที
- 💧 **ความชื้นดิน** — พร้อม Progress Bar แสดงระดับความชื้น (%)
- 🌡️ **อุณหภูมิดิน** — แสดงค่าเป็นองศาเซลเซียส (°C)
- ⚡ **EC (Electrical Conductivity)** — ค่าการนำไฟฟ้าของดิน (µS/cm)
- 🧪 **pH ดิน** — ความเป็นกรด-ด่าง
- 🌿 **NPK** — ปริมาณธาตุอาหาร ไนโตรเจน (N), ฟอสฟอรัส (P), โพแทสเซียม (K) (mg/kg)
- 🔔 **คำแนะนำอัตโนมัติ** — วิเคราะห์ค่าเซ็นเซอร์และแจ้งคำแนะนำการรดน้ำ
- 📡 **mDNS Support** — เข้าถึงได้ผ่าน `http://sprinkler.local` ใน Local Network
- 🔄 **Auto Fallback** — หาก ESP32 ไม่เชื่อมต่อ จะดึงข้อมูลจำลอง (Mock Data) จาก Cloud API แทน

---

## 🏗️ โครงสร้างโปรเจกต์

```
Agrisense/
├── esp32/                          # Firmware สำหรับ ESP32
│   ├── smart_sprinkler/
│   │   ├── smart_sprinkler.ino     # Arduino Sketch หลัก
│   │   └── dashboard.h             # HTML Dashboard (Embedded ใน Firmware)
│   └── dashboard.h                 # HTML สำรอง
│
├── dashboard/                      # Web Dashboard (Standalone)
│   ├── index.html                  # หน้าแดชบอร์ดหลัก
│   ├── style.css                   # สไตล์ชีท (Dark Theme)
│   └── script.js                   # Logic การดึงข้อมูลและอัปเดต UI
│
└── backend/                        # Cloud Backend API (Flask)
    ├── app.py                      # Flask Application
    ├── requirements.txt            # Python Dependencies
    └── render.yaml                 # Render.com Deployment Config
```

---

## 🔧 Hardware ที่ใช้

| อุปกรณ์          | รายละเอียด                      |
| ---------------- | ------------------------------- |
| **MCU**          | ESP32 (Wi-Fi + Bluetooth)       |
| **เซ็นเซอร์ดิน** | RS485 Modbus 7-in-1 Soil Sensor |
| **การสื่อสาร**   | RS485 (UART2: RX=16, TX=17)     |
| **Baud Rate**    | 4800 bps                        |
| **Modbus ID**    | 1                               |
| **พลังงาน**      | PowerBank                       |

### Register Map (Modbus)

| Register | ตัวแปร                 | หน่วย | สูตร             |
| -------- | ---------------------- | ----- | ---------------- |
| `0x0000` | Moisture (ความชื้น)    | %     | raw / 10         |
| `0x0001` | Temperature (อุณหภูมิ) | °C    | (int16) raw / 10 |
| `0x0002` | EC (การนำไฟฟ้า)        | µS/cm | raw              |
| `0x0003` | pH                     | —     | raw / 10         |
| `0x0004` | Nitrogen (N)           | mg/kg | raw              |
| `0x0005` | Phosphorus (P)         | mg/kg | raw              |
| `0x0006` | Potassium (K)          | mg/kg | raw              |

---

## 🚀 การติดตั้งและใช้งาน

### 1. ESP32 Firmware

#### สิ่งที่ต้องการ

- [Arduino IDE](https://www.arduino.cc/en/software) หรือ PlatformIO
- Library ที่จำเป็น:
  - `ModbusMaster` by Doc Walker
  - `WiFi` (Built-in ESP32)
  - `WebServer` (Built-in ESP32)
  - `ESPmDNS` (Built-in ESP32)

#### ขั้นตอน

1. เปิดไฟล์ `esp32/smart_sprinkler/smart_sprinkler.ino` ใน Arduino IDE
2. แก้ไขข้อมูล WiFi ในไฟล์:
   ```cpp
   const char* WIFI_SSID = "your_wifi_name";
   const char* WIFI_PASS = "your_wifi_password";
   ```
3. เลือก Board: **ESP32 Dev Module**
4. Upload Firmware ไปยัง ESP32
5. เปิด Serial Monitor (115200 baud) เพื่อดู IP Address
6. เข้าใช้งานผ่าน:
   - `http://<IP Address>` — IP ตรง
   - `http://sprinkler.local` — ผ่าน mDNS (ใน Local Network)

#### API Endpoint บน ESP32

```
GET /       → แสดง Dashboard HTML
GET /data   → ข้อมูลเซ็นเซอร์ JSON
```

---

### 2. Web Dashboard (Standalone)

Dashboard สามารถใช้งานได้โดยไม่ต้องติดตั้ง Server เพิ่มเติม:

1. เปิดไฟล์ `dashboard/index.html` ในเบราว์เซอร์
2. กดที่ไอคอน ⚙ เพื่อระบุ IP หรือ Hostname ของ ESP32
3. Dashboard จะดึงข้อมูลจาก `http://<host>/data` ทุก 5 วินาที

> **หมายเหตุ:** หาก ESP32 ไม่ตอบสนอง ระบบจะ fallback ไปดึงข้อมูลจาก Cloud Backend อัตโนมัติ

---

### 3. Cloud Backend (Flask API)

Backend ทำงานเป็น Mock API สำหรับ Development/Demo เมื่อไม่มี ESP32

#### รันในเครื่อง (Local)

```bash
cd backend
pip install -r requirements.txt
python app.py
```

API จะทำงานที่ `http://localhost:5000`

#### API Endpoints

| Method | Endpoint  | คำอธิบาย                               |
| ------ | --------- | -------------------------------------- |
| `GET`  | `/`       | ข้อมูล Service และ Endpoints ที่ใช้ได้ |
| `GET`  | `/health` | ตรวจสอบสถานะ Service                   |
| `GET`  | `/data`   | ข้อมูลเซ็นเซอร์ (Mock Data)            |

#### ตัวอย่าง Response (`/data`)

```json
{
  "moisture": 45.3,
  "temperature": 29.1,
  "ec": 342,
  "ph": 6.7,
  "n": 52,
  "p": 33,
  "k": 95,
  "valid": true
}
```

#### Deploy บน Render.com

โปรเจกต์มี `render.yaml` สำหรับ Deploy อัตโนมัติ:

1. Fork หรือ Push โปรเจกต์ไปยัง GitHub
2. เชื่อมต่อ Repository กับ [Render.com](https://render.com)
3. Render จะ Detect `render.yaml` และ Deploy อัตโนมัติ

---

## 🌐 สถาปัตยกรรมระบบ

```
┌─────────────────────────────────────────────────────────────────┐
│                         Agrisense System                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Soil Sensor]──RS485──[ESP32]──WiFi──[Browser Dashboard]       │
│   7-in-1 Modbus          │                    │                 │
│                          │        (Fallback)  │                 │
│                          └──HTTP──[Cloud API (Render)]──────────│
│                                    Flask + Gunicorn             │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **ESP32** อ่านค่าจาก Soil Sensor ผ่าน RS485 Modbus ทุก 5 วินาที
2. **ESP32** Serve ข้อมูลเป็น JSON ผ่าน HTTP Web Server (Port 80)
3. **Dashboard** ดึงข้อมูลจาก `http://sprinkler.local/data` (หรือ IP ที่ระบุ)
4. หาก ESP32 ไม่ตอบสนอง → **Dashboard** ดึง Mock Data จาก Cloud API แทน

---

## 📊 หน้าแดชบอร์ด

แดชบอร์ดออกแบบด้วย Dark Theme และ Typography ภาษาไทย รองรับทั้ง Desktop และ Mobile

### การ์ดข้อมูลที่แสดง

| การ์ด       | ข้อมูล               | สีธีม |
| ----------- | -------------------- | ----- |
| 💧 ความชื้น | % พร้อม Progress Bar | เขียว |
| 🌡️ อุณหภูมิ | °C                   | ส้ม   |
| ⚡ EC       | µS/cm                | ฟ้า   |
| 🧪 pH ดิน   | ค่า pH               | ม่วง  |
| 🌿 NPK      | N / P / K mg/kg      | ม่วง  |

### Status Badge

- 🟢 **ปกติ** — ค่าอยู่ในช่วงที่เหมาะสม
- 🟡 **เตือน** — ค่าอยู่นอกช่วงที่แนะนำ
- 🔴 **วิกฤต** — ต้องดำเนินการทันที

---

## 🛠️ Tech Stack

| Layer          | เทคโนโลยี                                               |
| -------------- | ------------------------------------------------------- |
| **Firmware**   | C++ (Arduino Framework), ModbusMaster, ESPmDNS          |
| **Frontend**   | HTML5, Vanilla CSS (Dark Theme), JavaScript (Fetch API) |
| **Backend**    | Python 3.10, Flask, Flask-CORS, Gunicorn                |
| **Deployment** | Render.com                                              |
| **Typography** | Google Fonts: Prompt, JetBrains Mono                    |

---

## 📝 License

The Jeng License — ใช้งานได้อย่างอิสระสำหรับโปรเจกต์การศึกษาและการเกษตร

---

<div align="center">
  <p>🌱 Smart Solar Sprinkler &copy; 2025 · RS485 Modbus 7-in-1 Soil Sensor</p>
  <p>Built with ❤️ for Smart Agriculture</p>
</div>
