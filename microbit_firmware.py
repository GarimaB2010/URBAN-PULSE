# ==============================================================================
# UrbanPulse BBC micro:bit IoT Environmental Node Firmware (MicroPython)
# ==============================================================================
# Instructions:
# 1. Open https://python.microbit.org/ in your browser (Chrome or Edge).
# 2. Connect your BBC micro:bit (V1 or V2) via USB.
# 3. Paste this code and click 'Send to micro:bit' or 'Flash'.
# 4. Open UrbanPulse web app, click 'Connect Micro:bit (Web Serial)', and select your micro:bit.
# 5. Shine a flashlight or phone light onto the micro:bit 5x5 LED matrix (which acts as a light sensor)
#    to simulate solar radiation spikes and trigger real-time urban heat cascade reactions!
# ==============================================================================

from microbit import *
import utime

# Configure UART serial baud rate to 115200 (industry standard for Web Serial)
uart.init(baudrate=115200)

display.show(Image.SUNNY)
utime.sleep_ms(1000)

while True:
    # Read ambient light level (0 = dark, 255 = direct bright flashlight)
    light = display.read_light_level()
    
    # Read on-chip temperature sensor (in Celsius)
    temp = temperature()
    
    # Visual feedback on 5x5 LED display:
    # Draw an animated thermal level bar indicating incoming solar radiation
    display.clear()
    bars = int((light / 255.0) * 5)
    for y in range(4, 4 - bars, -1):
        for x in range(5):
            display.set_pixel(x, y, 9)
            
    # Heartbeat dot on top-left
    if (utime.ticks_ms() // 500) % 2 == 0:
        display.set_pixel(0, 0, 5)

    # Transmit telemetry packet in JSON format over USB serial
    telemetry = '{"light":' + str(light) + ',"temp":' + str(temp) + '}\n'
    uart.write(telemetry)
    
    # Sample every 150 milliseconds
    utime.sleep_ms(150)
