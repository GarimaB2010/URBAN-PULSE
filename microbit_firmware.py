# UrbanPulse BBC micro:bit USB serial light sensor
# Flash using https://python.microbit.org/ (micro:bit V1 or V2).
# print() writes to USB serial; uart.write() uses hardware UART pins.
from microbit import *
import utime

display.clear()
while True:
    light = display.read_light_level()  # 0..255 relative brightness
    chip_temp = temperature()           # chip temperature, not ambient air
    print('{"light":%d,"temp":%d}' % (light, chip_temp))
    utime.sleep_ms(200)
